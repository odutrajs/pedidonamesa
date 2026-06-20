import { Navigate, Route, Routes } from 'react-router-dom';
import { SuperAdminLayout } from '../components/super-admin/SuperAdminLayout';
import { RestaurantsListTab } from '../components/super-admin/RestaurantsListTab';
import { RestaurantDetailTab } from '../components/super-admin/RestaurantDetailTab';

export function SuperAdminPage() {
  return (
    <Routes>
      <Route element={<SuperAdminLayout />}>
        <Route index element={<RestaurantsListTab />} />
        <Route path="restaurantes/:id" element={<RestaurantDetailTab />} />
        <Route path="*" element={<Navigate to="/super-admin" replace />} />
      </Route>
    </Routes>
  );
}
