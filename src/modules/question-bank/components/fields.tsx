import { Children, cloneElement, isValidElement, useId, type ReactNode } from 'react'
import { toast } from 'sonner'
import { Button } from '~/components/ui/button'
import { Input } from '~/components/ui/input'
import { Label } from '~/components/ui/label'
import { Textarea } from '~/components/ui/textarea'

export const selectClass = 'h-9 w-full rounded-md border border-input bg-background px-3 text-sm'
export function Field({ label, children }: { label: string; children: ReactNode }) {
  const fieldId = useId()
  const [control, ...extra] = Children.toArray(children)
  const element = isValidElement<{ id?: string }>(control) ? control : null
  const id = element?.props.id ?? fieldId
  return (
    <div className='grid gap-1.5 text-sm font-medium'>
      <Label htmlFor={id}>{label}</Label>
      {element ? cloneElement(element, { id }) : control}
      {extra}
    </div>
  )
}
export function TextField({
  label,
  value,
  onChange,
  required = false,
  maxLength = 100,
}: {
  label: string
  value: string
  onChange: (value: string) => void
  required?: boolean
  maxLength?: number
}) {
  return (
    <Field label={label}>
      <Input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        required={required}
        maxLength={maxLength}
      />
    </Field>
  )
}
export function MarkupField({
  label,
  value,
  onChange,
  required = false,
}: {
  label: string
  value: string
  onChange: (value: string) => void
  required?: boolean
}) {
  const uploadId = useId()
  async function insertImage(file?: File) {
    if (!file) return
    if (!['image/png', 'image/jpeg', 'image/gif', 'image/webp'].includes(file.type) || file.size > 180_000) {
      toast.error('请使用不超过 180 KB 的 PNG、JPEG、GIF 或 WebP 图片')
      return
    }
    const reader = new FileReader()
    reader.onload = () => onChange(`${value}\n\n![题目插图](${String(reader.result)})\n`)
    reader.onerror = () => toast.error('图片读取失败')
    reader.readAsDataURL(file)
  }
  return (
    <div className='space-y-1.5'>
      <Label htmlFor={`${uploadId}-text`}>{label}</Label>
      <Textarea
        id={`${uploadId}-text`}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        required={required}
        rows={4}
        maxLength={500_000}
      />
      <div className='flex flex-wrap items-center gap-2 text-xs'>
        <Button
          type='button'
          size='sm'
          variant='outline'
          onClick={() => onChange(`${value}\n<math><mfrac><mi>a</mi><mi>b</mi></mfrac></math>`)}
        >
          插入分式
        </Button>
        <Button
          type='button'
          size='sm'
          variant='outline'
          onClick={() => onChange(`${value}\n<math><msqrt><mi>x</mi></msqrt></math>`)}
        >
          插入根式
        </Button>
        <Button
          type='button'
          size='sm'
          variant='outline'
          onClick={() => onChange(`${value}\n<math><msup><mi>x</mi><mn>2</mn></msup></math>`)}
        >
          插入幂
        </Button>
        <label htmlFor={uploadId} className='cursor-pointer rounded-md border px-3 py-2 font-medium'>
          插入图片
        </label>
        <input
          id={uploadId}
          type='file'
          accept='image/png,image/jpeg,image/gif,image/webp'
          className='sr-only'
          onChange={(event) => {
            void insertImage(event.target.files?.[0])
            event.target.value = ''
          }}
        />
      </div>
    </div>
  )
}
