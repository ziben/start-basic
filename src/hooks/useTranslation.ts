import { useIntl } from 'react-intl'
import { useLocale } from '~/context/locale-context'
import { LocaleType } from '~/i18n'

export const useTranslation = () => {
  const intl = useIntl()
  const { locale, setLocale } = useLocale()

  const t = (id: string, values?: Record<string, any>) => {
    return intl.formatMessage({ id }, values)
  }

  return {
    t,
    locale,
    setLocale,
    intl,
  }
}
