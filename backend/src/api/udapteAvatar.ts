import { FastifyInstance } from 'fastify';
import db from '../database';
import path from 'path';
import fs from 'fs';

export default async function updateAvatar(fastify: FastifyInstance) {
  console.log('gggg');
  fastify.post('/api/updateAvatar', async (request, reply) => {
    const currentUser = (request.session as any)?.user;
    if (!currentUser) {
      return reply.status(401).send({ error: 'Unauthorized' });
    }

    const data = await request.file();
    if (!data || !data.filename) {
      return reply.status(400).send({ error: 'No file uploaded' });
    }

    if (!data.mimetype.startsWith('image/')) {
      return reply.status(400).send({ error: 'Only image files are allowed' });
    }

    const uploadDir = path.join(__dirname, '..', '..', 'public', 'avatar');
    if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

    const fileName = `avatar_${currentUser.id}_${Date.now()}${path.extname(data.filename)}`;
    const filePath = path.join(uploadDir, fileName);

    await fs.promises.writeFile(filePath, await data.toBuffer());

    const relativePath = `/avatar/${fileName}`;
    const result = db.prepare('UPDATE users SET avatar = ? WHERE id = ?').run(relativePath, currentUser.id);
    console.log('Updating avatar for user:', currentUser.id, 'path:', relativePath);
    console.log('DB update result:', result);
    request.session.user.avatar = relativePath;
    return reply.send({ success: true, avatar: relativePath });
  });
}
