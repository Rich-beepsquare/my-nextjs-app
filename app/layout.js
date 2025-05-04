// app/layout.js
import 'bootstrap/dist/css/bootstrap.min.css'
import 'bootstrap-icons/font/bootstrap-icons.css'
import './globals.css'

import SessionProvider from './SessionProvider'
import { OrgProvider } from './OrgProvider'

export const metadata = {
  title: 'My Agile AI Assistant',
  description: 'Secure, private AI-powered Agile coaching portal',
}

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
