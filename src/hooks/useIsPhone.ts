import { useEffect, useState } from 'react'

const QUERY = '(max-width: 767px)'

/** True below the 768px tablet breakpoint — same matchMedia+change-listener idiom ThemeContext uses for prefers-color-scheme. */
export function useIsPhone(): boolean {
  const [isPhone, setIsPhone] = useState(() => typeof window !== 'undefined' && window.matchMedia(QUERY).matches)

  useEffect(() => {
    const mq = window.matchMedia(QUERY)
    function handleChange() {
      setIsPhone(mq.matches)
    }
    handleChange()
    mq.addEventListener('change', handleChange)
    return () => mq.removeEventListener('change', handleChange)
  }, [])

  return isPhone
}
