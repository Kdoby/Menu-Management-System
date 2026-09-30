import { Link, NavLink, Outlet } from 'react-router'
import styles from './Layout.module.css'

export default function Layout() {
  return (
    <div className={styles.layout}>
      <header className={styles.header}>
        <div className={styles.bar}>
          <Link to="/" className={styles.logo}>
            <span className={styles.logoMark} aria-hidden="true">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M4 3v7a3 3 0 0 0 6 0V3" />
                <path d="M7 3v18" />
                <path d="M17 21V3c-2 1-3 4-3 7s1 4 3 4" />
              </svg>
            </span>
            <span className="headline1 bold">메뉴 관리</span>
          </Link>
          <nav aria-label="주요 메뉴" className={styles.nav}>
            <NavLink
              to="/menus"
              end
              className={({ isActive }) => `label1 ${isActive ? `bold ${styles.active}` : `medium ${styles.navLink}`}`}
            >
              메뉴 목록
            </NavLink>
            <Link to="/menus/new" className={`label1 bold ${styles.create}`}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden="true">
                <path d="M12 5v14M5 12h14" />
              </svg>
              메뉴 등록
            </Link>
          </nav>
        </div>
      </header>

      <main className={styles.main}>
        <Outlet />
      </main>

      <footer className={styles.footer}>
        <span className={`caption1 ${styles.footerCopy}`}>© 2026 메뉴 관리</span>
      </footer>
    </div>
  )
}
