import { forwardRef, type ReactNode } from 'react'
import { motion, useReducedMotion, type HTMLMotionProps } from 'framer-motion'

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger'
type Size = 'sm' | 'md'

interface Props extends Omit<HTMLMotionProps<'button'>, 'children'> {
  variant?: Variant
  size?: Size
  loading?: boolean
  icon?: ReactNode
  children?: ReactNode
}

const VARIANT_STYLE: Record<Variant, React.CSSProperties> = {
  primary: { background: 'var(--gradient-primary)', color: 'var(--ink)', border: 'none' },
  secondary: { background: 'transparent', color: 'var(--cream)', border: '1px solid var(--line)' },
  ghost: { background: 'transparent', color: 'var(--gold)', border: 'none', padding: 0 },
  danger: { background: 'transparent', color: 'var(--danger)', border: '1px solid color-mix(in srgb, var(--danger) 50%, transparent)' },
}

const SIZE_STYLE: Record<Size, React.CSSProperties> = {
  sm: { padding: '8px 16px', fontSize: 13 },
  md: { padding: '11px 22px', fontSize: 14.5 },
}

/** The one button every interactive action in the app should render — covers hover/focus-visible/active/disabled/loading per the design-system spec. */
const Button = forwardRef<HTMLButtonElement, Props>(function Button(
  { variant = 'primary', size = 'md', loading = false, icon, disabled, children, style, ...rest },
  ref
) {
  const reduceMotion = useReducedMotion()

  return (
    <motion.button
      ref={ref}
      disabled={disabled || loading}
      whileHover={reduceMotion || disabled || loading ? undefined : { filter: 'brightness(1.06)' }}
      whileTap={reduceMotion || disabled || loading ? undefined : { scale: 0.97 }}
      transition={{ duration: 0.15, ease: [0.2, 0.8, 0.2, 1] }}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        borderRadius: 10,
        fontWeight: 700,
        fontFamily: 'var(--font-body)',
        cursor: disabled || loading ? 'default' : 'pointer',
        opacity: disabled ? 0.45 : 1,
        transition: 'border-color .2s var(--ease), background .2s var(--ease)',
        ...VARIANT_STYLE[variant],
        ...SIZE_STYLE[size],
        ...style,
      }}
      {...rest}
    >
      {loading ? (
        <span
          aria-hidden
          style={{
            width: 14,
            height: 14,
            borderRadius: '50%',
            border: '2px solid currentColor',
            borderTopColor: 'transparent',
            animation: reduceMotion ? 'none' : 'btn-spin 0.8s linear infinite',
          }}
        />
      ) : (
        icon
      )}
      {children}
    </motion.button>
  )
})

export default Button
