import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/(public)/terms')({
  component: TermsPage,
})

function TermsPage() {
  return (
    <div className='container py-12'>
      <div className='mx-auto max-w-4xl'>
        <h1 className='mb-8 text-4xl font-bold tracking-tight'>服务条款</h1>
        
        <div className='prose prose-neutral max-w-none dark:prose-invert'>
          <p className='text-sm text-muted-foreground'>最后更新日期：2024年12月25日</p>

          <section className='mt-8'>
            <h2 className='mb-4 text-2xl font-semibold'>1. 接受条款</h2>
            <p className='text-muted-foreground'>
              欢迎使用我们的服务。通过访问或使用本网站及相关服务（以下简称"服务"），您同意受本服务条款（以下简称"条款"）的约束。如果您不同意这些条款，请不要使用我们的服务。
            </p>
          </section>

          <section className='mt-8'>
            <h2 className='mb-4 text-2xl font-semibold'>2. 服务说明</h2>
            <p className='text-muted-foreground'>
              本服务提供一个现代化的 Web 应用平台，包括但不限于用户管理、内容管理、数据分析等功能。我们保留随时修改、暂停或终止服务的权利，恕不另行通知。
            </p>
          </section>

          <section className='mt-8'>
            <h2 className='mb-4 text-2xl font-semibold'>3. 用户账户</h2>
            <div className='space-y-4 text-muted-foreground'>
              <p>使用某些服务功能需要注册账户。您同意：</p>
              <ul className='list-disc space-y-2 pl-6'>
                <li>提供真实、准确、完整的注册信息</li>
                <li>维护和及时更新您的账户信息</li>
                <li>对您账户下的所有活动负责</li>
                <li>保护账户密码的安全性和机密性</li>
                <li>如发现未经授权使用您的账户，立即通知我们</li>
              </ul>
            </div>
          </section>

          <section className='mt-8'>
            <h2 className='mb-4 text-2xl font-semibold'>4. 用户行为规范</h2>
            <div className='space-y-4 text-muted-foreground'>
              <p>使用我们的服务时，您不得：</p>
              <ul className='list-disc space-y-2 pl-6'>
                <li>违反任何适用的法律法规</li>
                <li>侵犯他人的知识产权或其他权利</li>
                <li>上传、发布或传播恶意软件、病毒或其他有害代码</li>
                <li>进行未经授权的访问、干扰或破坏服务</li>
                <li>发布虚假、误导性或欺诈性内容</li>
                <li>骚扰、威胁或侵犯他人隐私</li>
                <li>进行垃圾邮件发送或其他滥用行为</li>
              </ul>
            </div>
          </section>

          <section className='mt-8'>
            <h2 className='mb-4 text-2xl font-semibold'>5. 知识产权</h2>
            <p className='text-muted-foreground'>
              本服务及其所有内容、功能和特性（包括但不限于所有信息、软件、文本、显示、图像、视频和音频，以及设计、选择和排列）均由我们或我们的许可方拥有，受版权、商标、专利、商业秘密和其他知识产权法律的保护。
            </p>
          </section>

          <section className='mt-8'>
            <h2 className='mb-4 text-2xl font-semibold'>6. 用户内容</h2>
            <div className='space-y-4 text-muted-foreground'>
              <p>您对通过服务上传、发布或以其他方式提供的内容（"用户内容"）保留所有权利。通过提供用户内容，您授予我们：</p>
              <ul className='list-disc space-y-2 pl-6'>
                <li>非独占、全球性、免版税的许可，以使用、复制、修改、改编、发布、翻译、创建衍生作品、分发和展示用户内容</li>
                <li>该许可仅用于运营、推广和改进服务的目的</li>
              </ul>
            </div>
          </section>

          <section className='mt-8'>
            <h2 className='mb-4 text-2xl font-semibold'>7. 免责声明</h2>
            <div className='space-y-4 text-muted-foreground'>
              <p>
                本服务按"现状"和"可用"基础提供，不提供任何明示或暗示的保证，包括但不限于：
              </p>
              <ul className='list-disc space-y-2 pl-6'>
                <li>适销性、特定用途适用性或非侵权性的暗示保证</li>
                <li>服务将不间断、及时、安全或无错误</li>
                <li>通过服务获得的结果将准确或可靠</li>
                <li>服务中的任何错误将被纠正</li>
              </ul>
            </div>
          </section>

          <section className='mt-8'>
            <h2 className='mb-4 text-2xl font-semibold'>8. 责任限制</h2>
            <p className='text-muted-foreground'>
              在任何情况下，我们或我们的董事、员工、合作伙伴、代理人、供应商或关联公司均不对任何间接、附带、特殊、后果性或惩罚性损害承担责任，包括但不限于利润损失、数据丢失、使用损失、商誉损失或其他无形损失。
            </p>
          </section>

          <section className='mt-8'>
            <h2 className='mb-4 text-2xl font-semibold'>9. 赔偿</h2>
            <p className='text-muted-foreground'>
              您同意赔偿、辩护并使我们及我们的关联公司、董事、员工、代理人和合作伙伴免受因您使用服务、违反本条款或侵犯任何第三方权利而产生的任何索赔、损害、义务、损失、责任、成本或债务以及费用（包括但不限于律师费）的损害。
            </p>
          </section>

          <section className='mt-8'>
            <h2 className='mb-4 text-2xl font-semibold'>10. 条款变更</h2>
            <p className='text-muted-foreground'>
              我们保留随时修改或替换本条款的权利。如果修改是实质性的，我们将在新条款生效前至少提前 30 天通知您。继续使用服务即表示您接受修订后的条款。
            </p>
          </section>

          <section className='mt-8'>
            <h2 className='mb-4 text-2xl font-semibold'>11. 终止</h2>
            <p className='text-muted-foreground'>
              我们可以立即终止或暂停您的账户和访问服务的权限，无需事先通知或承担责任，原因包括但不限于您违反本条款。终止后，您使用服务的权利将立即停止。
            </p>
          </section>

          <section className='mt-8'>
            <h2 className='mb-4 text-2xl font-semibold'>12. 适用法律</h2>
            <p className='text-muted-foreground'>
              本条款应受中华人民共和国法律管辖并依其解释，不考虑其法律冲突规定。因本条款引起的或与之相关的任何争议应提交至有管辖权的法院解决。
            </p>
          </section>

          <section className='mt-8'>
            <h2 className='mb-4 text-2xl font-semibold'>13. 联系我们</h2>
            <div className='text-muted-foreground'>
              <p>如果您对本服务条款有任何疑问，请通过以下方式联系我们：</p>
              <ul className='mt-4 space-y-2'>
                <li>电子邮件：support@example.com</li>
                <li>地址：[您的公司地址]</li>
              </ul>
            </div>
          </section>
        </div>
      </div>
    </div>
  )
}

