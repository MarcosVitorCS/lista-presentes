// Compartilhado entre app/(public)/evento/[slug]/[list]/page.tsx e o
// loading.tsx da mesma rota. Antes eram duas strings de classe copiadas à
// mão nos dois arquivos, e já tinham divergido silenciosamente (loading.tsx
// usava py-12 sm:py-16, page.tsx usava py-[var(--spacing-section)] direto) —
// um só lugar pra editar container/padding da página de lista evita esse
// tipo de deriva de novo.
export const LIST_MAIN_CLASS =
  'mx-auto flex w-full max-w-5xl flex-1 flex-col gap-10 px-5 py-[var(--spacing-section)] sm:px-8 lg:max-w-6xl xl:max-w-7xl'
