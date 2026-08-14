import express, { type Request, type Response } from 'express';import cors from 'cors';
import { pool } from './db.js';

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Interfaces matching your DB schema
interface LibraryItem {
  id?: number;
  rawg_id: string;
  name: string;
  background_image?: string;
  status?: string;
  rating?: number;
  notes?: string;
}

// GET: Fetch all items
app.get('/api/library', async (req: Request, res: Response) => {
  try {
    const result = await pool.query('SELECT * FROM library ORDER BY created_at DESC');
    res.json(result.rows);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// POST: Add new game
app.post('/api/library', async (req: Request, res: Response) => {
  const { rawg_id, name, background_image, status, rating, notes }: LibraryItem = req.body;
  try {
    const result = await pool.query(
      `INSERT INTO library (rawg_id, name, background_image, status, rating, notes)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [rawg_id, name, background_image, status || 'Backlog', rating || 0, notes || '']
    );
    res.status(201).json(result.rows[0]);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH: Update game rating/status/notes
app.patch('/api/library/:id', async (req: Request, res: Response) => {
  const { id } = req.params;
  const { status, rating, notes }: Partial<LibraryItem> = req.body;
  try {
    const result = await pool.query(
      `UPDATE library 
       SET status = COALESCE($1, status),
           rating = COALESCE($2, rating),
           notes = COALESCE($3, notes)
       WHERE id = $4 RETURNING *`,
      [status, rating, notes, id]
    );
    res.json(result.rows[0]);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE: Remove game
app.delete('/api/library/:id', async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    await pool.query('DELETE FROM library WHERE id = $1', [id]);
    res.status(204).send();
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`Express server running on http://localhost:${PORT}`);
});