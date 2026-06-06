'use client'

import { useEffect, useRef } from 'react'

/**
 * Хук для попередження про незбережені зміни при закритті вкладки.
 *
 * @example
 * ```tsx
 * const [isDirty, setIsDirty] = useState(false)
 * useBeforeUnload(isDirty)
 * ```
 *
 * @param isDirty — true якщо є незбережені зміни
 * @param message — повідомлення (стандартне, браузер ігнорує кастомні повідомлення)
 */
export function useBeforeUnload(isDirty: boolean, message?: string): void {
  const messageRef = useRef(message)

  useEffect(() => {
    messageRef.current = message
  }, [message])

  useEffect(() => {
    if (!isDirty) return

    function handleBeforeUnload(event: BeforeUnloadEvent) {
      event.preventDefault()
      // Стандартний спосіб — браузер покаже своє повідомлення
      event.returnValue = messageRef.current ?? ''
    }

    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [isDirty])
}
