import { getSiteSettings, getContactChannels } from '@/lib/actions/settings'
import { ContactChannelList } from './contact-channels'
import { SiteSettingsList } from './site-settings'

export const dynamic = 'force-dynamic'

export default async function SettingsPage() {
  const [settings, channels] = await Promise.all([
    getSiteSettings(),
    getContactChannels(),
  ])

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold">Налаштування сайту</h1>

      <section>
        <h2 className="text-lg font-semibold mb-4">Параметри</h2>
        <SiteSettingsList settings={settings} />
      </section>

      <section>
        <h2 className="text-lg font-semibold mb-4">Контактні канали</h2>
        <ContactChannelList channels={channels} />
      </section>
    </div>
  )
}
