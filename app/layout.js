import 'bootstrap/dist/css/bootstrap.min.css'
import SessionProvider from './SessionProvider'
import { OrgProvider } from './OrgProvider'
import './globals.css'

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <SessionProvider>
          <OrgProvider>
            {children}
          </OrgProvider>
        </SessionProvider>
      </body>
    </html>
  )
}