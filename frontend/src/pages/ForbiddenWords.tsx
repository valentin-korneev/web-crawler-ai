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
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Box,
  Alert,
  FormControlLabel,
  Switch,
  Accordion,
  AccordionSummary,
  AccordionDetails,
} from '@mui/material';
import { 
  Edit as EditIcon, 
  Delete as DeleteIcon, 
  Add as AddIcon,
  ExpandMore as ExpandMoreIcon,
  Help as HelpIcon
} from '@mui/icons-material';
import { api } from '../services/api';
import { API_ENDPOINTS } from '../config/api';

interface ForbiddenWord {
  id: number;
  word: string;
  category: string;
  description: string | null;
  severity: string;
  is_active: boolean;
  case_sensitive: boolean;
  use_regex: boolean;
  created_at: string;
  updated_at: string;
}

interface ForbiddenWordFormData {
  word: string;
  category: string;
  description: string;
  severity: string;
  case_sensitive: boolean;
  use_regex: boolean;
}

const ForbiddenWords: React.FC = () => {
  const [words, setWords] = useState<ForbiddenWord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingWord, setEditingWord] = useState<ForbiddenWord | null>(null);
  const [formData, setFormData] = useState<ForbiddenWordFormData>({
    word: '',
    category: '',
    description: '',
    severity: 'medium',
    case_sensitive: false,
    use_regex: false,
  });

  const severityOptions = ['low', 'medium', 'high', 'critical'];

  useEffect(() => {
    fetchWords();
  }, []);

  const fetchWords = async () => {
    try {
      setLoading(true);
      const response = await api.get(API_ENDPOINTS.FORBIDDEN_WORDS.LIST);
      setWords(response.data);
      setError(null);
    } catch (err) {
      setError('Ошибка при загрузке запрещенных слов');
      console.error('Error fetching forbidden words:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    try {
      if (editingWord) {
        await api.put(API_ENDPOINTS.FORBIDDEN_WORDS.UPDATE(editingWord.id), formData);
      } else {
        await api.post(API_ENDPOINTS.FORBIDDEN_WORDS.CREATE, formData);
      }
      setDialogOpen(false);
      setEditingWord(null);
      resetForm();
      fetchWords();
    } catch (err) {
      setError('Ошибка при сохранении запрещенного слова');
      console.error('Error saving forbidden word:', err);
    }
  };

  const handleEdit = (word: ForbiddenWord) => {
    setEditingWord(word);
    setFormData({
      word: word.word,
      category: word.category,
      description: word.description || '',
      severity: word.severity,
      case_sensitive: word.case_sensitive,
      use_regex: word.use_regex,
    });
    setDialogOpen(true);
  };

  const handleDelete = async (id: number) => {
    if (window.confirm('Вы уверены, что хотите удалить это запрещенное слово?')) {
      try {
        await api.delete(API_ENDPOINTS.FORBIDDEN_WORDS.DELETE(id));
        fetchWords();
      } catch (err) {
        setError('Ошибка при удалении запрещенного слова');
        console.error('Error deleting forbidden word:', err);
      }
    }
  };

  const resetForm = () => {
    setFormData({
      word: '',
      category: '',
      description: '',
      severity: 'medium',
      case_sensitive: false,
      use_regex: false,
    });
  };

  const handleDialogClose = () => {
    setDialogOpen(false);
    setEditingWord(null);
    resetForm();
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'low': return 'success';
      case 'medium': return 'warning';
      case 'high': return 'error';
      case 'critical': return 'error';
      default: return 'default';
    }
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
          Запрещенные слова
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setDialogOpen(true)}
        >
          Добавить слово
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
              <TableCell>Слово</TableCell>
              <TableCell>Категория</TableCell>
              <TableCell>Описание</TableCell>
              <TableCell>Важность</TableCell>
              <TableCell>Статус</TableCell>
              <TableCell>Настройки</TableCell>
              <TableCell>Действия</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {words.map((word) => (
              <TableRow key={word.id}>
                <TableCell>
                  <Typography variant="body2" fontFamily="monospace">
                    {word.word}
                  </Typography>
                </TableCell>
                <TableCell>{word.category}</TableCell>
                <TableCell>{word.description}</TableCell>
                <TableCell>
                  <Chip
                    label={word.severity}
                    color={getSeverityColor(word.severity) as any}
                    size="small"
                  />
                </TableCell>
                <TableCell>
                  <Chip
                    label={word.is_active ? 'Активно' : 'Неактивно'}
                    color={word.is_active ? 'success' : 'default'}
                    size="small"
                  />
                </TableCell>
                <TableCell>
                  <Box display="flex" gap={1}>
                    {word.case_sensitive && (
                      <Chip label="Регистр" size="small" variant="outlined" />
                    )}
                    {word.use_regex && (
                      <Chip label="Regex" size="small" variant="outlined" />
                    )}
                  </Box>
                </TableCell>
                <TableCell>
                  <IconButton onClick={() => handleEdit(word)} size="small">
                    <EditIcon />
                  </IconButton>
                  <IconButton onClick={() => handleDelete(word.id)} size="small" color="error">
                    <DeleteIcon />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={dialogOpen} onClose={handleDialogClose} maxWidth="sm" fullWidth>
        <DialogTitle>
          {editingWord ? 'Редактировать запрещенное слово' : 'Добавить запрещенное слово'}
        </DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label="Слово или регулярное выражение"
            value={formData.word}
            onChange={(e) => setFormData({ ...formData, word: e.target.value })}
            margin="normal"
            required
            helperText={
              formData.use_regex 
                ? "Примеры: платеж.*, ^платеж, платеж$"
                : "Введите слово для поиска"
            }
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
            label="Описание"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            margin="normal"
            multiline
            rows={3}
          />
          <FormControl fullWidth margin="normal">
            <InputLabel>Важность</InputLabel>
            <Select
              value={formData.severity}
              onChange={(e) => setFormData({ ...formData, severity: e.target.value })}
              label="Важность"
            >
              {severityOptions.map((option) => (
                <MenuItem key={option} value={option}>
                  {option}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          
          <Box sx={{ mt: 2 }}>
            <FormControlLabel
              control={
                <Switch
                  checked={formData.case_sensitive}
                  onChange={(e) => setFormData({ ...formData, case_sensitive: e.target.checked })}
                />
              }
              label="Учитывать регистр"
            />
            <FormControlLabel
              control={
                <Switch
                  checked={formData.use_regex}
                  onChange={(e) => setFormData({ ...formData, use_regex: e.target.checked })}
                />
              }
              label="Регулярное выражение"
            />
          </Box>
          
          {formData.use_regex && (
            <Accordion sx={{ mt: 2 }}>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Box display="flex" alignItems="center" gap={1}>
                  <HelpIcon color="info" />
                  <Typography>Помощь по регулярным выражениям</Typography>
                </Box>
              </AccordionSummary>
              <AccordionDetails>
                <Typography variant="body2" paragraph>
                  <strong>Примеры регулярных выражений:</strong>
                </Typography>
                <Box component="ul" sx={{ pl: 2 }}>
                  <li><code>платеж.*</code> - все слова, начинающиеся с "платеж"</li>
                  <li><code>^платеж</code> - слова, начинающиеся с "платеж"</li>
                  <li><code>платеж$</code> - слова, заканчивающиеся на "платеж"</li>
                  <li><code>платеж\w*</code> - "платеж" + любые буквы/цифры</li>
                  <li><code>платеж[а-я]*</code> - "платеж" + русские буквы</li>
                  <li><code>платеж\s+система</code> - "платеж" + пробелы + "система"</li>
                  <li><code>(платеж|оплата)</code> - "платеж" или "оплата"</li>
                </Box>
                <Typography variant="body2" sx={{ mt: 1 }}>
                  <strong>Специальные символы:</strong>
                </Typography>
                <Box component="ul" sx={{ pl: 2 }}>
                  <li><code>.</code> - любой символ</li>
                  <li><code>*</code> - 0 или более повторений</li>
                  <li><code>+</code> - 1 или более повторений</li>
                  <li><code>?</code> - 0 или 1 повторение</li>
                  <li><code>\w</code> - буква, цифра или подчеркивание</li>
                  <li><code>\s</code> - пробел, табуляция, перенос строки</li>
                  <li><code>^</code> - начало строки</li>
                  <li><code>$</code> - конец строки</li>
                </Box>
              </AccordionDetails>
            </Accordion>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDialogClose}>Отмена</Button>
          <Button onClick={handleSubmit} variant="contained">
            {editingWord ? 'Сохранить' : 'Добавить'}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default ForbiddenWords; 