# Orderly: Order Management System

Orderly is an order management application built with **Java and Spring Boot microservices** and a **React + TypeScript** web client. Users register, browse products, place orders and track them. Admins manage products and move orders through their lifecycle.

## Features

- Register and login with JWT authentication, passwords hashed with BCrypt
- Role-based access (`USER`, `ADMIN`) plus ownership checks (users only see their own orders)
- Product catalog with search; admins can create, edit and delete products
- Cart and order placement with **all-or-nothing stock reservation**
- Order lifecycle: `PLACED -> CONFIRMED -> SHIPPED -> DELIVERED`, or `CANCELLED` (stock is returned)
- Resilient service-to-service calls with a circuit breaker and clear fallback errors
- Runs as one Docker Compose stack

## Architecture

```
Browser -> nginx (client) -> API Gateway :8080 -> auth-service    :8081 -> auth_db
                                  |  JWT check          product-service :8082 -> product_db
                                  |  Eureka lookup      order-service   :8083 -> order_db
                                                              |
                                                  Feign + circuit breaker
                                                              v
                                            product-service /internal/products/*
All services register with Eureka :8761
```

| Module | Port | Responsibility |
|---|---|---|
| `eureka-server` | 8761 | Service registry and discovery |
| `api-gateway` | 8080 | Single entry point, routes `/api/**`, verifies the JWT, forwards the user identity to services |
| `auth-service` | 8081 | Registration, login, JWT creation (`auth_db`) |
| `product-service` | 8082 | Product CRUD and stock reservation using database row locks (`product_db`) |
| `order-service` | 8083 | Orders and order lifecycle, calls product-service through Feign (`order_db`) |
| `client` | 80 | React app served by nginx, which also proxies `/api` to the gateway |
| `mysql` | 3306 | One MySQL server with three databases (one per service) |

## Tech stack

- **Backend:** Java 17, Spring Boot 3.5, Spring Web, Spring Data JPA (Hibernate), Spring Security (BCrypt), Bean Validation, Lombok
- **Microservices:** Spring Cloud 2025.0 (Eureka, Gateway, OpenFeign), Resilience4j circuit breaker
- **Auth:** JWT (HS256) with jjwt
- **Database:** MySQL 8.4
- **Frontend:** React 19, TypeScript, Vite, React Router
- **DevOps:** Docker, Docker Compose, nginx, multi-stage builds

## Key design decisions

- **Database per service.** No service reads another service's tables. `Order` stores only a `userId`, and copies the product name and price into `OrderItem`, so old orders keep their original prices.
- **Authentication at the gateway.** The gateway verifies the JWT once, removes any client-supplied `X-User-*` headers, and passes the verified `X-User-Id`, `X-User-Email` and `X-User-Role` headers to the services. Only `/api/**` is routed, so `/internal/**` endpoints cannot be reached from outside.
- **Stock reservation without overselling.** Product rows are locked with `SELECT ... FOR UPDATE` (in id order, to avoid deadlocks), and the whole reservation runs in one transaction that rolls back on any failure.
- **Saga with compensation.** Placing an order reserves stock in product-service, saves the order in order-service's own transaction, and releases the stock if saving fails. Cancelling an order also releases the stock.
- **Circuit breaker.** Calls to product-service use Resilience4j: the circuit opens when 50% of the last 10 calls fail (at least 5 calls), stays open for 15 seconds, then allows 3 trial calls. Business errors (4xx, such as insufficient stock) do not count as failures. When the service is unavailable the API answers `503` with a clear message.
- **Order status state machine.** Only valid transitions are accepted (for example `DELIVERED` cannot be cancelled).

## API summary

All endpoints are called through the gateway. Everything except register and login needs `Authorization: Bearer <token>`.

| Method | Path | Access |
|---|---|---|
| POST | `/api/auth/register` | public |
| POST | `/api/auth/login` | public |
| GET | `/api/products?q=` | logged in |
| GET | `/api/products/{id}` | logged in |
| POST / PUT / DELETE | `/api/products`, `/api/products/{id}` | admin |
| POST | `/api/orders` | logged in |
| GET | `/api/orders` | own orders |
| GET | `/api/orders/all` | admin |
| GET | `/api/orders/{id}` | owner or admin |
| PATCH | `/api/orders/{id}/cancel` | owner or admin |
| PATCH | `/api/orders/{id}/status` | admin |

Errors are returned as JSON: `{ "status", "error", "message", "timestamp" }` with `400`, `401`, `403`, `404`, `409` or `503`.

## Project structure

```
orderly/
  pom.xml                 parent Maven project (5 modules)
  Dockerfile              one multi-stage Dockerfile for all Java services (build arg MODULE)
  docker-compose.yml      full stack
  .env.example            environment variables
  eureka-server/  api-gateway/  auth-service/  product-service/  order-service/
  client/                 React + TypeScript app, nginx.conf, Dockerfile
```

## Configuration

| Variable | Used by | Description |
|---|---|---|
| `MYSQL_ROOT_PASSWORD` | mysql, all services | Database password |
| `JWT_SECRET` | auth-service, api-gateway | HS256 signing key, **at least 32 characters**, must be the same for both |
| `ADMIN_EMAIL`, `ADMIN_PASSWORD` | auth-service | Admin account created on first start (defaults `admin@orderly.com` / `Admin@123`) |
| `CLIENT_PORT` | client | Host port for the web app (default `8088`) |

Change the defaults before exposing the app publicly.

## Run with Docker Compose

Only Docker is needed. The Java services and the React client are built inside the images.

```bash
cp .env.example .env      # edit the values
docker compose up -d --build
```

Wait about 2 minutes (services must register with Eureka), then open `http://localhost:8088`.

### Deploy as a Portainer stack

1. Push the repository to GitHub.
2. Portainer: **Stacks > Add stack > Repository**, compose path `docker-compose.yml`.
3. Add the environment variables from the table above.
4. Deploy the stack. The first build takes several minutes.

Only the `client` container is exposed. The compose file attaches it to an external Docker network named `edge`, so a reverse proxy or tunnel (for example Cloudflare Tunnel) can reach it as `http://orderly-client:80`. If you do not use such a network, remove the `edge` entries from `docker-compose.yml`.

## Run locally without Docker

Requirements: JDK 17, Maven, Node 20+, MySQL on `localhost:3306` (user `root`, password `root`, or set `DB_USERNAME` / `DB_PASSWORD`). The databases are created automatically.

Start each in its own terminal from the project root, in this order:

```bash
mvn -pl eureka-server spring-boot:run
mvn -pl auth-service spring-boot:run
mvn -pl product-service spring-boot:run
mvn -pl order-service spring-boot:run
mvn -pl api-gateway spring-boot:run
```

Then the client:

```bash
cd client
npm install
npm run dev
```

Open `http://localhost:5173` (the dev server proxies `/api` to the gateway). The Eureka dashboard is at `http://localhost:8761`.

## Try the API

```bash
BASE=http://localhost:8088

# login as admin and copy the token
curl -s -X POST $BASE/api/auth/login -H 'Content-Type: application/json' \
  -d '{"email":"admin@orderly.com","password":"Admin@123"}'

TOKEN=<paste token>

# list products
curl -s $BASE/api/products -H "Authorization: Bearer $TOKEN"

# place an order
curl -s -X POST $BASE/api/orders -H "Authorization: Bearer $TOKEN" -H 'Content-Type: application/json' \
  -d '{"items":[{"productId":1,"quantity":2}]}'
```

### See the circuit breaker work

```bash
docker stop orderly-product        # place an order: 503 "Product service is unavailable..."
docker start orderly-product       # after a short wait, orders work again
```

## Possible improvements

- Database migrations with Flyway
- Refresh tokens and token revocation
- Rate limiting at the gateway
- Outbox pattern or a message broker for reliable stock release
- Service-to-service authentication
- Pagination, automated tests and OpenAPI documentation