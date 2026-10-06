export function useBackendMenu() {
  const navItems = [
    { label: 'The Index', to: '/' },
    { label: 'Backend', to: '/backend', current: true },
  ]
  const menuItems = [
    { key: 'posts', label: 'Posts', to: '/backend/posts' },
    { key: 'pages', label: 'Pages', to: '/backend/pages' },
    { key: 'categories', label: 'Categories', to: '/backend/categories' },
    { key: 'media', label: 'Media', to: '/backend/media' },
    { key: 'tags', label: 'Tags', to: '/backend/tags' },
    { key: 'menus', label: 'Menus', to: '/backend/menus' },
    { key: 'sites', label: 'Sites', to: '/backend/sites' },
  ]
  return { navItems, menuItems }
}
