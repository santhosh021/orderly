import { NavLink } from 'react-router-dom';

export default function AdminTabs() {
  return (
    <div className="admin-tabs">
      <NavLink to="/admin/products">Products</NavLink>
      <NavLink to="/admin/orders">Orders</NavLink>
    </div>
  );
}
