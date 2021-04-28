/* eslint-disable @typescript-eslint/no-explicit-any */
declare module '*.svg' {
  const content: any
  export default content
}

declare module '*.css' {
  const css: any
  export default css
}

declare module '*.yaml' {
  const value: Record<string, any>
  export default value
}

declare module '*.yml' {
  const value: Record<string, any>
  export default value
}

/* Extend Window to support NextJS properties (@see Button.tsx) */
interface Window {
  next: any
  __NEXT_DATA__: any
}
