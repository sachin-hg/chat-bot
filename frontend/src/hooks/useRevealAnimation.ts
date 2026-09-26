import { useEffect } from 'react'

export function useRevealAnimation() {
  useEffect(() => {
    const targets = document.querySelectorAll(
      '.callout, .diagram-wrap, .two-col, .mental-grid, .learning-obj, .code-header'
    )
    const obs = new IntersectionObserver(
      (entries) => {
        entries.forEach(e => {
          if (e.isIntersecting) {
            e.target.classList.add('visible')
            obs.unobserve(e.target)
          }
        })
      },
      { threshold: 0.1 }
    )
    targets.forEach(el => {
      el.classList.add('reveal')
      obs.observe(el)
    })
    return () => obs.disconnect()
  }, [])
}
