import { createBrowserRouter, createRoutesFromElements, Navigate, Route, RouterProvider } from 'react-router'
import Layout from './components/layout/Layout.jsx'
import HomePage from './pages/HomePage.jsx'
import MenuListPage from './pages/MenuListPage.jsx'
import MenuDetailPage from './pages/MenuDetailPage.jsx'
import MenuFormPage from './pages/MenuFormPage.jsx'

// 폼 이탈 확인(useBlocker)이 데이터 라우터에서만 동작해서 createBrowserRouter 를 쓴다.
const router = createBrowserRouter(
  createRoutesFromElements(
    <Route element={<Layout />}>
      <Route path="/" element={<HomePage />} />
      <Route path="/menus" element={<MenuListPage />} />
      <Route path="/menus/new" element={<MenuFormPage />} />
      <Route path="/menus/:menuCode" element={<MenuDetailPage />} />
      <Route path="/menus/:menuCode/edit" element={<MenuFormPage />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Route>,
  ),
)

export default function App() {
  return <RouterProvider router={router} />
}
