import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import fs from 'fs'
import path from 'path'

// Plugin to save files locally during development
function localFileSaver() {
  return {
    name: 'local-file-saver',
    configureServer(server) {
      server.middlewares.use('/api/save-pan-card', async (req, res) => {
        if (req.method !== 'POST') {
          res.statusCode = 405
          res.end(JSON.stringify({ error: 'Method not allowed' }))
          return
        }

        let body = ''
        req.on('data', chunk => {
          body += chunk.toString()
        })

        req.on('end', () => {
          try {
            const { sessionId, frontImage, backImage } = JSON.parse(body)
            
            // Create the pan_cards directory if it doesn't exist
            const panCardsDir = path.resolve(__dirname, 'src/assets/pan_cards')
            if (!fs.existsSync(panCardsDir)) {
              fs.mkdirSync(panCardsDir, { recursive: true })
            }

            // Save front image
            if (frontImage) {
              const frontBase64 = frontImage.replace(/^data:image\/\w+;base64,/, '')
              const frontBuffer = Buffer.from(frontBase64, 'base64')
              const frontPath = path.join(panCardsDir, `${sessionId}_pan_front.jpg`)
              fs.writeFileSync(frontPath, frontBuffer)
            }

            // Save back image
            if (backImage) {
              const backBase64 = backImage.replace(/^data:image\/\w+;base64,/, '')
              const backBuffer = Buffer.from(backBase64, 'base64')
              const backPath = path.join(panCardsDir, `${sessionId}_pan_back.jpg`)
              fs.writeFileSync(backPath, backBuffer)
            }

            res.setHeader('Content-Type', 'application/json')
            res.end(JSON.stringify({
              success: true,
              frontPath: `src/assets/pan_cards/${sessionId}_pan_front.jpg`,
              backPath: `src/assets/pan_cards/${sessionId}_pan_back.jpg`
            }))
          } catch (error) {
            console.error('Error saving PAN card images:', error)
            res.statusCode = 500
            res.end(JSON.stringify({ error: 'Failed to save images' }))
          }
        })
      })
    }
  }
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss(), localFileSaver()],
})
