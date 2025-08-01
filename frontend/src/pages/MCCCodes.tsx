import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Chip,
  Box,
  Alert,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Switch,
  FormControlLabel,
} from '@mui/material';
import { Edit as EditIcon, Delete as DeleteIcon, Add as AddIcon } from '@mui/icons-material';
import { api } from '../services/api';
import { API_ENDPOINTS } from '../config/api';

interface MCCCode {
  id: number;
  code: string;
  description: string;
  category: string;
  keywords: string[];
  tags: string[];
  keyword_weight: number;
  tag_weight: number;
  is_active: boolean;
  min_probability: number;
  created_at: string;
  updated_at: string;
}

interface MCCCodeFormData {
  code: string;
  description: string;
  category: string;
  keywords: string[];
  tags: string[];
  keyword_weight: number;
  tag_weight: number;
  min_probability: number;
}

const MCCCodes: React.FC = () => {
  const [codes, setCodes] = useState<MCCCode[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingCode, setEditingCode] = useState<MCCCode | null>(null);
  const [formData, setFormData] = useState<MCCCodeFormData>({
    code: '',
    description: '',
    category: '',
    keywords: [],
    tags: [],
    keyword_weight: 1.0,
    tag_weight: 0.5,
    min_probability: 0.7,
  });

  useEffect(() => {
    fetchCodes();
  }, []);

  const fetchCodes = async () => {
    try {
      setLoading(true);
      const response = await api.get(API_ENDPOINTS.MCC_CODES.LIST);
      setCodes(response.data);
      setError(null);
    } catch (err) {
      setError('Ошибка при загрузке MCC кодов');
      console.error('Error fetching MCC codes:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    try {
      if (editingCode) {
        await api.put(API_ENDPOINTS.MCC_CODES.UPDATE(editingCode.id), formData);
      } else {
        await api.post(API_ENDPOINTS.MCC_CODES.CREATE, formData);
      }
      setDialogOpen(false);
      setEditingCode(null);
      resetForm();
      fetchCodes();
    } catch (err) {
      setError('Ошибка при сохранении MCC кода');
      console.error('Error saving MCC code:', err);
    }
  };

  const handleEdit = (code: MCCCode) => {
    setEditingCode(code);
    setFormData({
      code: code.code,
      description: code.description,
      category: code.category,
      keywords: code.keywords,
      tags: code.tags,
      keyword_weight: code.keyword_weight,
      tag_weight: code.tag_weight,
      min_probability: code.min_probability,
    });
    setDialogOpen(true);
  };

  const handleDelete = async (id: number) => {
    if (window.confirm('Вы уверены, что хотите удалить этот MCC код?')) {
      try {
        await api.delete(API_ENDPOINTS.MCC_CODES.DELETE(id));
        fetchCodes();
      } catch (err) {
        setError('Ошибка при удалении MCC кода');
        console.error('Error deleting MCC code:', err);
      }
    }
  };

  const resetForm = () => {
    setFormData({
      code: '',
      description: '',
      category: '',
      keywords: [],
      tags: [],
      keyword_weight: 1.0,
      tag_weight: 0.5,
      min_probability: 0.7,
    });
  };

  const handleDialogClose = () => {
    setDialogOpen(false);
    setEditingCode(null);
    resetForm();
  };

  const handleKeywordsChange = (value: string) => {
    const keywords = value.split(',').map(k => k.trim()).filter(k => k);
    setFormData({ ...formData, keywords });
  };

  const handleTagsChange = (value: string) => {
    const tags = value.split(',').map(t => t.trim()).filter(t => t);
    setFormData({ ...formData, tags });
  };

  if (loading) {
    return (
      <Container>
        <Typography>Загрузка...</Typography>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" component="h1">
          MCC коды
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setDialogOpen(true)}
        >
          Добавить код
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Код</TableCell>
              <TableCell>Описание</TableCell>
              <TableCell>Категория</TableCell>
              <TableCell>Ключевые слова</TableCell>
              <TableCell>Теги</TableCell>
              <TableCell>Вес ключевых слов</TableCell>
              <TableCell>Вес тегов</TableCell>
              <TableCell>Мин. вероятность</TableCell>
              <TableCell>Статус</TableCell>
              <TableCell>Действия</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {codes.map((code) => (
              <TableRow key={code.id}>
                <TableCell>
                  <Typography variant="body2" fontFamily="monospace" fontWeight="bold">
                    {code.code}
                  </Typography>
                </TableCell>
                <TableCell>{code.description}</TableCell>
                <TableCell>{code.category}</TableCell>
                <TableCell>
                  <Box display="flex" flexWrap="wrap" gap={0.5}>
                    {code.keywords.map((keyword, index) => (
                      <Chip key={index} label={keyword} size="small" />
                    ))}
                  </Box>
                </TableCell>
                <TableCell>
                  <Box display="flex" flexWrap="wrap" gap={0.5}>
                    {code.tags.map((tag, index) => (
                      <Chip key={index} label={tag} size="small" variant="outlined" />
                    ))}
                  </Box>
                </TableCell>
                <TableCell>{code.keyword_weight}</TableCell>
                <TableCell>{code.tag_weight}</TableCell>
                <TableCell>{code.min_probability}</TableCell>
                <TableCell>
                  <Chip
                    label={code.is_active ? 'Активен' : 'Неактивен'}
                    color={code.is_active ? 'success' : 'default'}
                    size="small"
                  />
                </TableCell>
                <TableCell>
                  <IconButton onClick={() => handleEdit(code)} size="small">
                    <EditIcon />
                  </IconButton>
                  <IconButton onClick={() => handleDelete(code.id)} size="small" color="error">
                    <DeleteIcon />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={dialogOpen} onClose={handleDialogClose} maxWidth="md" fullWidth>
        <DialogTitle>
          {editingCode ? 'Редактировать MCC код' : 'Добавить MCC код'}
        </DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label="Код"
            value={formData.code}
            onChange={(e) => setFormData({ ...formData, code: e.target.value })}
            margin="normal"
            required
            disabled={!!editingCode}
          />
          <TextField
            fullWidth
            label="Описание"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            margin="normal"
            required
          />
          <TextField
            fullWidth
            label="Категория"
            value={formData.category}
            onChange={(e) => setFormData({ ...formData, category: e.target.value })}
            margin="normal"
            required
          />
          <TextField
            fullWidth
            label="Ключевые слова (через запятую)"
            value={formData.keywords.join(', ')}
            onChange={(e) => handleKeywordsChange(e.target.value)}
            margin="normal"
            helperText="Введите ключевые слова через запятую"
          />
          <TextField
            fullWidth
            label="Теги (через запятую)"
            value={formData.tags.join(', ')}
            onChange={(e) => handleTagsChange(e.target.value)}
            margin="normal"
            helperText="Введите теги через запятую"
          />
          <Box display="flex" gap={2} mt={2}>
            <TextField
              label="Вес ключевых слов"
              type="number"
              value={formData.keyword_weight}
              onChange={(e) => setFormData({ ...formData, keyword_weight: parseFloat(e.target.value) })}
              inputProps={{ step: 0.1, min: 0, max: 10 }}
            />
            <TextField
              label="Вес тегов"
              type="number"
              value={formData.tag_weight}
              onChange={(e) => setFormData({ ...formData, tag_weight: parseFloat(e.target.value) })}
              inputProps={{ step: 0.1, min: 0, max: 10 }}
            />
            <TextField
              label="Мин. вероятность"
              type="number"
              value={formData.min_probability}
              onChange={(e) => setFormData({ ...formData, min_probability: parseFloat(e.target.value) })}
              inputProps={{ step: 0.1, min: 0, max: 1 }}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDialogClose}>Отмена</Button>
          <Button onClick={handleSubmit} variant="contained">
            {editingCode ? 'Сохранить' : 'Добавить'}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default MCCCodes; 