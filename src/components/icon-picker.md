# Icon Picker 图标选择器

一个基于 Lucide React 的图标选择器组件，支持搜索和表单集成。

## 特性

- 🎨 支持所有 Lucide React 图标（1000+ 个图标）
- 🔍 实时搜索过滤
- 📝 完美集成 React Hook Form
- ♿ 无障碍支持
- 🎯 网格布局展示
- 📱 响应式设计

## 基本用法

### 独立使用

```tsx
import { IconPicker } from '@/components/icon-picker'

function MyComponent() {
  const [icon, setIcon] = useState('')

  return (
    <IconPicker 
      value={icon} 
      onValueChange={setIcon}
      placeholder="选择图标"
    />
  )
}
```

### 在表单中使用

```tsx
import { useForm } from 'react-hook-form'
import { IconPicker } from '@/components/icon-picker'
import { Form, FormField, FormItem, FormLabel, FormControl } from '@/components/ui/form'

function MyForm() {
  const form = useForm({
    defaultValues: {
      icon: '',
    },
  })

  return (
    <Form {...form}>
      <FormField
        control={form.control}
        name="icon"
        render={({ field }) => (
          <FormItem>
            <FormLabel>图标</FormLabel>
            <FormControl>
              <IconPicker
                value={field.value}
                onValueChange={field.onChange}
              />
            </FormControl>
          </FormItem>
        )}
      />
    </Form>
  )
}
```

### 显示选中的图标

```tsx
import * as LucideIcons from 'lucide-react'

function DisplayIcon({ iconName }: { iconName: string }) {
  const IconComponent = LucideIcons[iconName as keyof typeof LucideIcons] as React.ComponentType

  return (
    <div>
      {IconComponent && <IconComponent className="size-6" />}
    </div>
  )
}
```

## Props

| 属性 | 类型 | 默认值 | 描述 |
|-----|------|--------|------|
| `value` | `string` | - | 当前选中的图标名称 |
| `onValueChange` | `(value: string) => void` | - | 图标变化时的回调 |
| `disabled` | `boolean` | `false` | 是否禁用 |
| `className` | `string` | - | 自定义类名 |
| `placeholder` | `string` | `'选择图标'` | 占位符文本 |

## 示例

完整示例请查看 `icon-picker-demo.tsx`

## 技术实现

- 使用 `Popover` 和 `Command` 组件
- 自动过滤所有可用的 Lucide 图标
- 网格布局，每行 6 个图标
- ScrollArea 支持大量图标的滚动
- 搜索功能基于图标名称的模糊匹配

## 依赖

- `lucide-react`: 图标库
- `@radix-ui/react-popover`: Popover 组件
- `cmdk`: Command 组件
- `@radix-ui/react-scroll-area`: 滚动区域组件
