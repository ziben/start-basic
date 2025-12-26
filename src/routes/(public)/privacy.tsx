import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/(public)/privacy')({
  component: PrivacyPage,
})

function PrivacyPage() {
  return (
    <div className='container py-12'>
      <div className='mx-auto max-w-4xl'>
        <h1 className='mb-8 text-4xl font-bold tracking-tight'>隐私政策</h1>
        
        <div className='prose prose-neutral max-w-none dark:prose-invert'>
          <p className='text-sm text-muted-foreground'>最后更新日期：2024年12月25日</p>

          <section className='mt-8'>
            <h2 className='mb-4 text-2xl font-semibold'>1. 引言</h2>
            <p className='text-muted-foreground'>
              我们重视您的隐私。本隐私政策说明了我们如何收集、使用、披露和保护您在使用我们的服务时提供的信息。请仔细阅读本隐私政策。如果您不同意本政策的条款，请不要访问或使用我们的服务。
            </p>
          </section>

          <section className='mt-8'>
            <h2 className='mb-4 text-2xl font-semibold'>2. 我们收集的信息</h2>
            
            <h3 className='mb-3 mt-6 text-xl font-semibold'>2.1 您提供的信息</h3>
            <div className='space-y-4 text-muted-foreground'>
              <p>当您使用我们的服务时，我们可能会收集以下信息：</p>
              <ul className='list-disc space-y-2 pl-6'>
                <li><strong>账户信息：</strong>姓名、电子邮件地址、用户名、密码</li>
                <li><strong>个人资料信息：</strong>头像、个人简介、偏好设置</li>
                <li><strong>联系信息：</strong>电话号码、地址（如适用）</li>
                <li><strong>支付信息：</strong>支付方式、账单地址（如适用）</li>
              </ul>
            </div>

            <h3 className='mb-3 mt-6 text-xl font-semibold'>2.2 自动收集的信息</h3>
            <div className='space-y-4 text-muted-foreground'>
              <p>当您访问我们的服务时，我们会自动收集某些信息：</p>
              <ul className='list-disc space-y-2 pl-6'>
                <li><strong>设备信息：</strong>IP 地址、浏览器类型、操作系统、设备标识符</li>
                <li><strong>使用数据：</strong>访问时间、访问页面、点击流数据</li>
                <li><strong>位置信息：</strong>通过 IP 地址推断的大致地理位置</li>
                <li><strong>Cookie 和类似技术：</strong>用于识别和跟踪用户的小型数据文件</li>
              </ul>
            </div>
          </section>

          <section className='mt-8'>
            <h2 className='mb-4 text-2xl font-semibold'>3. 我们如何使用您的信息</h2>
            <div className='space-y-4 text-muted-foreground'>
              <p>我们使用收集的信息用于以下目的：</p>
              <ul className='list-disc space-y-2 pl-6'>
                <li>提供、维护和改进我们的服务</li>
                <li>处理您的交易和请求</li>
                <li>向您发送技术通知、更新、安全警报和支持消息</li>
                <li>回应您的评论、问题和客户服务请求</li>
                <li>监控和分析使用趋势和活动</li>
                <li>检测、预防和解决技术问题和安全威胁</li>
                <li>个性化和改善您的体验</li>
                <li>向您发送营销和促销信息（您可以选择退出）</li>
                <li>遵守法律义务和执行我们的条款</li>
              </ul>
            </div>
          </section>

          <section className='mt-8'>
            <h2 className='mb-4 text-2xl font-semibold'>4. 信息共享和披露</h2>
            <div className='space-y-4 text-muted-foreground'>
              <p>我们可能在以下情况下共享您的信息：</p>
              
              <h3 className='mb-3 mt-6 text-lg font-semibold'>4.1 服务提供商</h3>
              <p>我们可能与第三方服务提供商共享信息，以帮助我们运营、提供、改进、理解、定制、支持和营销我们的服务。</p>

              <h3 className='mb-3 mt-6 text-lg font-semibold'>4.2 法律要求</h3>
              <p>如果法律要求或我们真诚地认为此类行动对于以下目的是必要的，我们可能会披露您的信息：</p>
              <ul className='list-disc space-y-2 pl-6'>
                <li>遵守法律义务</li>
                <li>保护和捍卫我们的权利或财产</li>
                <li>防止或调查可能的不当行为</li>
                <li>保护用户或公众的人身安全</li>
              </ul>

              <h3 className='mb-3 mt-6 text-lg font-semibold'>4.3 业务转让</h3>
              <p>如果我们参与合并、收购或资产出售，您的信息可能会被转让。我们将在您的信息被转让并受不同隐私政策约束之前通知您。</p>

              <h3 className='mb-3 mt-6 text-lg font-semibold'>4.4 征得同意</h3>
              <p>在您同意的情况下，我们可能会出于其他目的共享您的信息。</p>
            </div>
          </section>

          <section className='mt-8'>
            <h2 className='mb-4 text-2xl font-semibold'>5. 数据安全</h2>
            <p className='text-muted-foreground'>
              我们采取合理的技术和组织措施来保护您的个人信息免遭未经授权的访问、使用、披露、更改或销毁。这些措施包括：
            </p>
            <ul className='mt-4 list-disc space-y-2 pl-6 text-muted-foreground'>
              <li>加密传输中和静止状态的敏感数据</li>
              <li>定期安全审计和漏洞评估</li>
              <li>访问控制和身份验证机制</li>
              <li>员工安全培训和保密协议</li>
            </ul>
            <p className='mt-4 text-muted-foreground'>
              但是，请注意，没有任何互联网传输或电子存储方法是 100% 安全的。虽然我们努力使用商业上可接受的方式来保护您的个人信息，但我们无法保证其绝对安全。
            </p>
          </section>

          <section className='mt-8'>
            <h2 className='mb-4 text-2xl font-semibold'>6. 数据保留</h2>
            <p className='text-muted-foreground'>
              我们将在必要的时间内保留您的个人信息，以实现本隐私政策中概述的目的，除非法律要求或允许更长的保留期。当我们不再需要使用您的信息时，我们将从我们的系统中删除或匿名化它。
            </p>
          </section>

          <section className='mt-8'>
            <h2 className='mb-4 text-2xl font-semibold'>7. 您的权利</h2>
            <div className='space-y-4 text-muted-foreground'>
              <p>根据适用法律，您可能拥有以下权利：</p>
              <ul className='list-disc space-y-2 pl-6'>
                <li><strong>访问权：</strong>请求访问我们持有的关于您的个人信息</li>
                <li><strong>更正权：</strong>请求更正不准确或不完整的信息</li>
                <li><strong>删除权：</strong>请求删除您的个人信息</li>
                <li><strong>限制处理权：</strong>请求限制我们如何使用您的信息</li>
                <li><strong>数据可携权：</strong>以结构化、常用和机器可读的格式接收您的信息</li>
                <li><strong>反对权：</strong>反对我们处理您的信息</li>
                <li><strong>撤回同意权：</strong>在我们依赖您的同意的情况下，随时撤回您的同意</li>
              </ul>
              <p className='mt-4'>
                要行使这些权利，请通过下面提供的联系信息与我们联系。我们将在合理的时间范围内回应您的请求。
              </p>
            </div>
          </section>

          <section className='mt-8'>
            <h2 className='mb-4 text-2xl font-semibold'>8. Cookie 和跟踪技术</h2>
            <div className='space-y-4 text-muted-foreground'>
              <p>我们使用 Cookie 和类似的跟踪技术来跟踪我们服务上的活动并保存某些信息。Cookie 类型包括：</p>
              <ul className='list-disc space-y-2 pl-6'>
                <li><strong>必要 Cookie：</strong>使网站正常运行所必需</li>
                <li><strong>功能 Cookie：</strong>记住您的偏好和选择</li>
                <li><strong>分析 Cookie：</strong>帮助我们了解访问者如何使用我们的网站</li>
                <li><strong>广告 Cookie：</strong>用于向您展示相关广告</li>
              </ul>
              <p className='mt-4'>
                您可以指示您的浏览器拒绝所有 Cookie 或指示何时发送 Cookie。但是，如果您不接受 Cookie，您可能无法使用我们服务的某些部分。
              </p>
            </div>
          </section>

          <section className='mt-8'>
            <h2 className='mb-4 text-2xl font-semibold'>9. 第三方链接</h2>
            <p className='text-muted-foreground'>
              我们的服务可能包含指向非我们运营的第三方网站的链接。如果您点击第三方链接，您将被定向到该第三方的网站。我们强烈建议您查看您访问的每个网站的隐私政策。我们对任何第三方网站或服务的内容、隐私政策或做法不承担任何责任。
            </p>
          </section>

          <section className='mt-8'>
            <h2 className='mb-4 text-2xl font-semibold'>10. 儿童隐私</h2>
            <p className='text-muted-foreground'>
              我们的服务不针对 13 岁以下的儿童。我们不会有意收集 13 岁以下儿童的个人身份信息。如果您是父母或监护人，并且您知道您的孩子向我们提供了个人信息，请与我们联系。如果我们发现我们在未经父母同意的情况下收集了 13 岁以下儿童的个人信息，我们将采取措施从我们的服务器中删除该信息。
            </p>
          </section>

          <section className='mt-8'>
            <h2 className='mb-4 text-2xl font-semibold'>11. 国际数据传输</h2>
            <p className='text-muted-foreground'>
              您的信息可能会被传输到并维护在您所在州、省、国家或其他政府管辖区之外的计算机上，这些地方的数据保护法律可能与您所在管辖区的法律不同。如果您位于中国境外并选择向我们提供信息，请注意我们会将数据（包括个人信息）传输到中国并在那里进行处理。
            </p>
          </section>

          <section className='mt-8'>
            <h2 className='mb-4 text-2xl font-semibold'>12. 隐私政策的变更</h2>
            <p className='text-muted-foreground'>
              我们可能会不时更新我们的隐私政策。我们将通过在本页面上发布新的隐私政策来通知您任何更改。我们将通过电子邮件和/或我们服务上的显著通知在更改生效之前通知您，并更新本隐私政策顶部的"最后更新日期"。建议您定期查看本隐私政策以了解任何更改。隐私政策的更改在本页面上发布时生效。
            </p>
          </section>

          <section className='mt-8'>
            <h2 className='mb-4 text-2xl font-semibold'>13. 联系我们</h2>
            <div className='text-muted-foreground'>
              <p>如果您对本隐私政策有任何疑问或疑虑，请通过以下方式联系我们：</p>
              <ul className='mt-4 space-y-2'>
                <li>电子邮件：privacy@example.com</li>
                <li>地址：[您的公司地址]</li>
                <li>电话：[您的联系电话]</li>
              </ul>
            </div>
          </section>

          <section className='mt-8'>
            <h2 className='mb-4 text-2xl font-semibold'>14. 数据保护官</h2>
            <p className='text-muted-foreground'>
              如果您对我们如何处理您的个人数据有任何疑问或疑虑，您可以联系我们的数据保护官：
            </p>
            <ul className='mt-4 space-y-2 text-muted-foreground'>
              <li>姓名：[数据保护官姓名]</li>
              <li>电子邮件：dpo@example.com</li>
            </ul>
          </section>
        </div>
      </div>
    </div>
  )
}
