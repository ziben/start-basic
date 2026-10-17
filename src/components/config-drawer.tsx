import { type SVGProps } from 'react'
import { useTranslation } from '@/modules/admin/shared/hooks/use-translation'
import { useDirection } from '@/shared/context/direction-provider'
import { type Collapsible, useLayout } from '@/shared/context/layout-provider'
import { useTheme } from '@/shared/context/theme-provider'
import { cn } from '@/shared/lib/utils'
import { CircleCheck, RotateCcw, Settings } from 'lucide-react'
import { RadioGroup as RadioGroupPrimitive } from 'radix-ui'
import { IconDir } from '@/assets/custom/icon-dir'
import { IconLayoutCompact } from '@/assets/custom/icon-layout-compact'
import { IconLayoutDefault } from '@/assets/custom/icon-layout-default'
import { IconLayoutFull } from '@/assets/custom/icon-layout-full'
import { IconSidebarFloating } from '@/assets/custom/icon-sidebar-floating'
import { IconSidebarInset } from '@/assets/custom/icon-sidebar-inset'
import { IconSidebarSidebar } from '@/assets/custom/icon-sidebar-sidebar'
import { IconThemeDark } from '@/assets/custom/icon-theme-dark'
import { IconThemeLight } from '@/assets/custom/icon-theme-light'
import { IconThemeSystem } from '@/assets/custom/icon-theme-system'
import { Button } from '@/components/ui/button'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import { useSidebar } from './ui/sidebar'

const Radio = RadioGroupPrimitive.Root
const Item = RadioGroupPrimitive.Item

type RadioItemConfig = {
  value: string
  labelKey: string
  icon: (props: SVGProps<SVGSVGElement>) => React.ReactElement
}

export function ConfigDrawer() {
  const { setOpen } = useSidebar()
  const { t } = useTranslation()
  const { resetDir } = useDirection()
  const { resetTheme } = useTheme()
  const { resetLayout } = useLayout()

  const handleReset = () => {
    setOpen(true)
    resetDir()
    resetTheme()
    resetLayout()
  }

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button
          size='icon'
          variant='ghost'
          aria-label={t('themeDrawer.open')}
          aria-describedby='config-drawer-description'
          className='rounded-full'
        >
          <Settings aria-hidden='true' />
        </Button>
      </SheetTrigger>
      <SheetContent className='flex flex-col'>
        <SheetHeader className='pb-0 text-start'>
          <SheetTitle>{t('themeDrawer.title')}</SheetTitle>
          <SheetDescription id='config-drawer-description'>{t('themeDrawer.description')}</SheetDescription>
        </SheetHeader>
        <div className='space-y-6 overflow-y-auto px-4'>
          <ThemeConfig />
          <SidebarConfig />
          <LayoutConfig />
          <DirConfig />
        </div>
        <SheetFooter className='gap-2'>
          <Button variant='destructive' onClick={handleReset} aria-label={t('themeDrawer.resetAria')}>
            {t('themeDrawer.reset')}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}

function SectionTitle({
  title,
  showReset = false,
  onReset,
  className,
}: {
  title: string
  showReset?: boolean
  onReset?: () => void
  className?: string
}) {
  return (
    <div className={cn('mb-2 flex items-center gap-2 text-sm font-semibold text-muted-foreground', className)}>
      {title}
      {showReset && onReset && (
        <Button size='icon' variant='secondary' className='size-4 rounded-full' onClick={onReset}>
          <RotateCcw className='size-3' />
        </Button>
      )}
    </div>
  )
}

function RadioGroupItem({ item, isTheme = false }: { item: RadioItemConfig; isTheme?: boolean }) {
  const { t } = useTranslation()
  const label = t(item.labelKey)

  return (
    <Item
      value={item.value}
      className={cn('group outline-none', 'transition duration-200 ease-in')}
      aria-label={t('themeDrawer.select', { label: label.toLowerCase() })}
      aria-describedby={`${item.value}-description`}
    >
      <div
        className={cn(
          'relative rounded-[6px] ring-[1px] ring-border',
          'group-data-[state=checked]:shadow-2xl group-data-[state=checked]:ring-primary',
          'group-focus-visible:ring-2'
        )}
        role='img'
        aria-hidden='false'
        aria-label={t('themeDrawer.optionPreview', { label })}
      >
        <CircleCheck
          className={cn(
            'size-6 fill-primary stroke-white',
            'group-data-[state=unchecked]:hidden',
            'absolute top-0 right-0 translate-x-1/2 -translate-y-1/2'
          )}
          aria-hidden='true'
        />
        <item.icon
          className={cn(
            !isTheme &&
              'fill-primary stroke-primary group-data-[state=unchecked]:fill-muted-foreground group-data-[state=unchecked]:stroke-muted-foreground'
          )}
          aria-hidden='true'
        />
      </div>
      <div className='mt-1 text-xs' id={`${item.value}-description`} aria-live='polite'>
        {label}
      </div>
    </Item>
  )
}

function ThemeConfig() {
  const { t } = useTranslation()
  const { defaultTheme, theme, setTheme } = useTheme()
  return (
    <div>
      <SectionTitle
        title={t('themeDrawer.section.theme')}
        showReset={theme !== defaultTheme}
        onReset={() => setTheme(defaultTheme)}
      />
      <Radio
        value={theme}
        onValueChange={setTheme}
        className='grid w-full max-w-md grid-cols-3 gap-4'
        aria-label={t('themeDrawer.theme.aria')}
        aria-describedby='theme-description'
      >
        {[
          {
            value: 'system',
            labelKey: 'themeDrawer.theme.system',
            icon: IconThemeSystem,
          },
          {
            value: 'light',
            labelKey: 'themeDrawer.theme.light',
            icon: IconThemeLight,
          },
          {
            value: 'dark',
            labelKey: 'themeDrawer.theme.dark',
            icon: IconThemeDark,
          },
        ].map((item) => (
          <RadioGroupItem key={item.value} item={item} isTheme />
        ))}
      </Radio>
      <div id='theme-description' className='sr-only'>
        {t('themeDrawer.theme.description')}
      </div>
    </div>
  )
}

function SidebarConfig() {
  const { t } = useTranslation()
  const { defaultVariant, variant, setVariant } = useLayout()
  return (
    <div className='max-md:hidden'>
      <SectionTitle
        title={t('themeDrawer.section.sidebar')}
        showReset={defaultVariant !== variant}
        onReset={() => setVariant(defaultVariant)}
      />
      <Radio
        value={variant}
        onValueChange={setVariant}
        className='grid w-full max-w-md grid-cols-3 gap-4'
        aria-label={t('themeDrawer.sidebar.aria')}
        aria-describedby='sidebar-description'
      >
        {[
          {
            value: 'inset',
            labelKey: 'themeDrawer.sidebar.inset',
            icon: IconSidebarInset,
          },
          {
            value: 'floating',
            labelKey: 'themeDrawer.sidebar.floating',
            icon: IconSidebarFloating,
          },
          {
            value: 'sidebar',
            labelKey: 'themeDrawer.sidebar.sidebar',
            icon: IconSidebarSidebar,
          },
        ].map((item) => (
          <RadioGroupItem key={item.value} item={item} />
        ))}
      </Radio>
      <div id='sidebar-description' className='sr-only'>
        {t('themeDrawer.sidebar.description')}
      </div>
    </div>
  )
}

function LayoutConfig() {
  const { t } = useTranslation()
  const { open, setOpen } = useSidebar()
  const { defaultCollapsible, collapsible, setCollapsible } = useLayout()

  const radioState = open ? 'default' : collapsible

  return (
    <div className='max-md:hidden'>
      <SectionTitle
        title={t('themeDrawer.section.layout')}
        showReset={radioState !== 'default'}
        onReset={() => {
          setOpen(true)
          setCollapsible(defaultCollapsible)
        }}
      />
      <Radio
        value={radioState}
        onValueChange={(v) => {
          if (v === 'default') {
            setOpen(true)
            return
          }
          setOpen(false)
          setCollapsible(v as Collapsible)
        }}
        className='grid w-full max-w-md grid-cols-3 gap-4'
        aria-label={t('themeDrawer.layout.aria')}
        aria-describedby='layout-description'
      >
        {[
          {
            value: 'default',
            labelKey: 'themeDrawer.layout.default',
            icon: IconLayoutDefault,
          },
          {
            value: 'icon',
            labelKey: 'themeDrawer.layout.compact',
            icon: IconLayoutCompact,
          },
          {
            value: 'offcanvas',
            labelKey: 'themeDrawer.layout.full',
            icon: IconLayoutFull,
          },
        ].map((item) => (
          <RadioGroupItem key={item.value} item={item} />
        ))}
      </Radio>
      <div id='layout-description' className='sr-only'>
        {t('themeDrawer.layout.description')}
      </div>
    </div>
  )
}

function DirConfig() {
  const { t } = useTranslation()
  const { defaultDir, dir, setDir } = useDirection()
  return (
    <div>
      <SectionTitle
        title={t('themeDrawer.section.direction')}
        showReset={defaultDir !== dir}
        onReset={() => setDir(defaultDir)}
      />
      <Radio
        value={dir}
        onValueChange={setDir}
        className='grid w-full max-w-md grid-cols-3 gap-4'
        aria-label={t('themeDrawer.direction.aria')}
        aria-describedby='direction-description'
      >
        {[
          {
            value: 'ltr',
            labelKey: 'themeDrawer.direction.ltr',
            icon: (props: SVGProps<SVGSVGElement>) => <IconDir dir='ltr' {...props} />,
          },
          {
            value: 'rtl',
            labelKey: 'themeDrawer.direction.rtl',
            icon: (props: SVGProps<SVGSVGElement>) => <IconDir dir='rtl' {...props} />,
          },
        ].map((item) => (
          <RadioGroupItem key={item.value} item={item} />
        ))}
      </Radio>
      <div id='direction-description' className='sr-only'>
        {t('themeDrawer.direction.description')}
      </div>
    </div>
  )
}
