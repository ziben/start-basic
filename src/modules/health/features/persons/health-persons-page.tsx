import { useState, type FormEvent, type ReactElement } from 'react'
import { Link } from '@tanstack/react-router'
import { AlertCircle, Loader2, Plus, Users } from 'lucide-react'
import { toast } from 'sonner'
import { AppHeaderMain } from '~/components/layout/app-header-main'
import { Alert, AlertDescription, AlertTitle } from '~/components/ui/alert'
import { Button } from '~/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/card'
import { Input } from '~/components/ui/input'
import { Label } from '~/components/ui/label'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '~/components/ui/table'
import { Textarea } from '~/components/ui/textarea'
import { useCreateHealthPerson, useHealthPersonsQuery } from '../../shared/hooks/use-health-persons'

export function HealthPersonsPage(): ReactElement {
  const { data: persons = [], error, isLoading } = useHealthPersonsQuery()
  const createPerson = useCreateHealthPerson()
  const [name, setName] = useState('')
  const [gender, setGender] = useState('')
  const [birthDate, setBirthDate] = useState('')
  const [relationLabel, setRelationLabel] = useState('')
  const [note, setNote] = useState('')

  async function handleCreate(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault()
    try {
      await createPerson.mutateAsync({
        name,
        gender: gender || undefined,
        birthDate: birthDate || undefined,
        relationLabel: relationLabel || undefined,
        note: note || undefined,
      })
      setName('')
      setGender('')
      setBirthDate('')
      setRelationLabel('')
      setNote('')
      toast.success('人员档案已创建')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : '创建人员档案失败')
    }
  }

  return (
    <AppHeaderMain fixed>
      <div className='mb-4 flex flex-wrap items-center justify-between gap-3'>
        <div>
          <h2 className='text-2xl font-bold tracking-tight'>人员档案</h2>
          <p className='text-muted-foreground'>维护本人及家庭成员的健康档案</p>
        </div>
        <Button asChild variant='outline'>
          <Link to='/health/reports'>体检报告</Link>
        </Button>
      </div>

      {error && (
        <Alert variant='destructive' className='mb-4'>
          <AlertCircle />
          <AlertTitle>人员档案加载失败</AlertTitle>
          <AlertDescription>{error instanceof Error ? error.message : '请稍后重试'}</AlertDescription>
        </Alert>
      )}

      <Card className='mb-4'>
        <CardHeader>
          <CardTitle className='text-base'>新增人员</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleCreate} className='space-y-4'>
            <div className='grid gap-4 sm:grid-cols-2 lg:grid-cols-4'>
              <div className='space-y-2'>
                <Label htmlFor='personName'>姓名</Label>
                <Input
                  id='personName'
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  placeholder='请输入姓名'
                  maxLength={50}
                  required
                />
              </div>
              <div className='space-y-2'>
                <Label htmlFor='personGender'>性别</Label>
                <select
                  id='personGender'
                  value={gender}
                  onChange={(event) => setGender(event.target.value)}
                  className='h-9 w-full rounded-md border border-input bg-background px-3 text-sm'
                >
                  <option value=''>未填写</option>
                  <option value='女'>女</option>
                  <option value='男'>男</option>
                  <option value='其他'>其他</option>
                </select>
              </div>
              <div className='space-y-2'>
                <Label htmlFor='personBirthDate'>出生日期</Label>
                <Input
                  id='personBirthDate'
                  type='date'
                  value={birthDate}
                  onChange={(event) => setBirthDate(event.target.value)}
                />
              </div>
              <div className='space-y-2'>
                <Label htmlFor='personRelation'>关系</Label>
                <Input
                  id='personRelation'
                  value={relationLabel}
                  onChange={(event) => setRelationLabel(event.target.value)}
                  placeholder='例如：本人、父亲'
                  maxLength={30}
                />
              </div>
            </div>
            <div className='space-y-2'>
              <Label htmlFor='personNote'>备注</Label>
              <Textarea
                id='personNote'
                value={note}
                onChange={(event) => setNote(event.target.value)}
                placeholder='可记录过敏史、长期用药等档案备注'
                maxLength={500}
                rows={2}
              />
            </div>
            <div className='flex justify-end'>
              <Button type='submit' disabled={createPerson.isPending || !name.trim()}>
                {createPerson.isPending ? (
                  <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                ) : (
                  <Plus className='mr-2 h-4 w-4' />
                )}
                新增人员
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className='flex items-center text-base'>
            <Users className='mr-2 h-4 w-4' />
            人员列表
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>姓名</TableHead>
                <TableHead>性别</TableHead>
                <TableHead>关系</TableHead>
                <TableHead>出生日期</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {persons.map((person) => (
                <TableRow key={person.id}>
                  <TableCell className='font-medium'>{person.name}</TableCell>
                  <TableCell>{person.gender ?? '-'}</TableCell>
                  <TableCell>{person.relationLabel ?? '-'}</TableCell>
                  <TableCell>
                    {person.birthDate ? new Date(person.birthDate).toLocaleDateString('zh-CN') : '-'}
                  </TableCell>
                </TableRow>
              ))}
              {(isLoading || persons.length === 0) && (
                <TableRow>
                  <TableCell colSpan={4} className='h-28 text-center text-muted-foreground'>
                    {isLoading ? '正在加载人员档案...' : '暂无人员档案，请先新增人员'}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </AppHeaderMain>
  )
}
