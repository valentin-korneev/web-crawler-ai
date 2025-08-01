import React, { useState, useEffect } from 'react';
import {
  Typography,
  Box,
  Button,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Alert,
  FormControl,
  InputLabel,
  Select,
  MenuItem
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  PlayArrow as ScanIcon,
  Refresh as RescanIcon,
  Visibility as ViewPagesIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

interface Contractor {
  id: number;
  name: string;
  domain: string;
  description: string | null;
  is_active: boolean;
  check_schedule: string;
  last_check: string | null;
  next_check: string | null;
  max_pages: number | null;
  max_depth: number | null;
  mcc_code: string | null;
  mcc_probability: number;
  total_pages: number;
  scanned_pages: number;
  violations_found: number;
  created_at: string;
  updated_at: string;
}

interface ContractorFormData {
  name: string;
  domain: string;
  description: string;
  check_schedule: string;
  max_pages: number | null;
  max_depth: number | null;
}

const Contractors: React.FC = () => {
  const navigate = useNavigate();
  const [contractors, setContractors] = useState<Contractor[]>([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingContractor, setEditingContractor] = useState<Contractor | null>(null);
  const [formData, setFormData] = useState<ContractorFormData>({
    name: '',
    domain: '',
    description: '',
    check_schedule: 'daily',
    max_pages: 100,
    max_depth: 3,
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(false);

  const api = axios.create({
    baseURL: process.env.REACT_APP_API_URL || 'https://localhost/api',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  // Добавляем токен к запросам
  api.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  });

  useEffect(() => {
    fetchContractors();
  }, []);

  const fetchContractors = async () => {
    setFetching(true);
    try {
      const response = await api.get('/v1/contractors/');
      setContractors(response.data);
    } catch (error: any) {
      setError(error.response?.data?.detail || 'Ошибка загрузки контрагентов');
    } finally {
      setFetching(false);
    }
  };

  const handleOpenDialog = (contractor?: Contractor) => {
    if (contractor) {
      setEditingContractor(contractor);
      setFormData({
        name: contractor.name,
        domain: contractor.domain,
        description: contractor.description || '',
        check_schedule: contractor.check_schedule,
        max_pages: contractor.max_pages,
        max_depth: contractor.max_depth,
      });
    } else {
      setEditingContractor(null);
      setFormData({
        name: '',
        domain: '',
        description: '',
        check_schedule: 'daily',
        max_pages: 100,
        max_depth: 3,
      });
    }
    setOpenDialog(true);
    setError('');
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingContractor(null);
    setError('');
  };

  const handleSubmit = async () => {
    setLoading(true);
    setError('');

    try {
      if (editingContractor) {
        // Обновление контрагента
        const updateData = {
          name: formData.name,
          description: formData.description,
          check_schedule: formData.check_schedule,
          max_pages: formData.max_pages,
          max_depth: formData.max_depth,
        };
        
        await api.put(`/v1/contractors/${editingContractor.id}`, updateData);
      } else {
        // Создание нового контрагента
        await api.post('/v1/contractors/', formData);
      }
      
      handleCloseDialog();
      fetchContractors();
    } catch (error: any) {
      setError(error.response?.data?.detail || 'Ошибка сохранения контрагента');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteContractor = async (contractorId: number) => {
    if (!window.confirm('Вы уверены, что хотите удалить этого контрагента?')) {
      return;
    }

    try {
      await api.delete(`/v1/contractors/${contractorId}`);
      fetchContractors();
    } catch (error: any) {
      setError(error.response?.data?.detail || 'Ошибка удаления контрагента');
    }
  };

  const handleStartScan = async (contractorId: number) => {
    try {
      await api.post(`/v1/contractors/${contractorId}/scan`);
      alert('Сканирование запущено');
      fetchContractors(); // Обновляем список
    } catch (error: any) {
      setError(error.response?.data?.detail || 'Ошибка запуска сканирования');
    }
  };

  const handleRescan = async (contractorId: number) => {
    if (!window.confirm('Вы уверены, что хотите запустить пересканирование для этого контрагента?')) {
      return;
    }
    try {
      await api.post(`/v1/contractors/${contractorId}/rescan`);
      alert('Пересканирование запущено');
      fetchContractors(); // Обновляем список
    } catch (error: any) {
      setError(error.response?.data?.detail || 'Ошибка запуска пересканирования');
    }
  };

  const handleViewPages = (contractorId: number) => {
    navigate(`/contractors/${contractorId}/pages`);
  };

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4">
          Контрагенты
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => handleOpenDialog()}
        >
          Добавить контрагента
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
              <TableCell>Название</TableCell>
              <TableCell>Домен</TableCell>
              <TableCell>Статус</TableCell>
              <TableCell>Страницы</TableCell>
              <TableCell>Нарушения</TableCell>
              <TableCell>Последняя проверка</TableCell>
              <TableCell>MCC код</TableCell>
              <TableCell>Действия</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {fetching ? (
              <TableRow>
                <TableCell colSpan={8} align="center">
                  <Typography color="textSecondary">
                    Загрузка...
                  </Typography>
                </TableCell>
              </TableRow>
            ) : contractors.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} align="center">
                  <Typography color="textSecondary">
                    Контрагенты не найдены. Добавьте первого контрагента.
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              contractors.map((contractor) => (
                <TableRow key={contractor.id}>
                  <TableCell>{contractor.name}</TableCell>
                  <TableCell>{contractor.domain}</TableCell>
                  <TableCell>
                    <Typography
                      variant="body2"
                      color={contractor.is_active ? 'success.main' : 'error.main'}
                    >
                      {contractor.is_active ? 'Активен' : 'Неактивен'}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    {contractor.scanned_pages}/{contractor.total_pages}
                  </TableCell>
                  <TableCell>
                    <Typography
                      variant="body2"
                      color={contractor.violations_found > 0 ? 'error.main' : 'success.main'}
                    >
                      {contractor.violations_found}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    {contractor.last_check 
                      ? new Date(contractor.last_check).toLocaleDateString()
                      : 'Не проверялся'
                    }
                  </TableCell>
                  <TableCell>
                    {contractor.mcc_code || '-'}
                  </TableCell>
                  <TableCell>
                    <IconButton
                      size="small"
                      onClick={() => handleOpenDialog(contractor)}
                    >
                      <EditIcon />
                    </IconButton>
                    <IconButton
                      size="small"
                      color="primary"
                      onClick={() => handleStartScan(contractor.id)}
                      title="Запустить сканирование"
                    >
                      <ScanIcon />
                    </IconButton>
                    <IconButton
                      size="small"
                      color="info"
                      onClick={() => handleViewPages(contractor.id)}
                      title="Просмотр страниц"
                    >
                      <ViewPagesIcon />
                    </IconButton>
                    <IconButton
                      size="small"
                      color="error"
                      onClick={() => handleDeleteContractor(contractor.id)}
                    >
                      <DeleteIcon />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>
          {editingContractor ? 'Редактировать контрагента' : 'Добавить контрагента'}
        </DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label="Название"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            margin="normal"
            required
          />
          <TextField
            fullWidth
            label="Домен"
            value={formData.domain}
            onChange={(e) => setFormData({ ...formData, domain: e.target.value })}
            margin="normal"
            required
            placeholder="example.com"
            disabled={!!editingContractor}
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
            <InputLabel>Расписание проверок</InputLabel>
            <Select
              value={formData.check_schedule}
              onChange={(e) => setFormData({ ...formData, check_schedule: e.target.value })}
              label="Расписание проверок"
            >
              <MenuItem value="daily">Ежедневно</MenuItem>
              <MenuItem value="weekly">Еженедельно</MenuItem>
              <MenuItem value="monthly">Ежемесячно</MenuItem>
            </Select>
          </FormControl>
          <TextField
            fullWidth
            label="Максимум страниц"
            type="number"
            value={formData.max_pages || ''}
            onChange={(e) => setFormData({ ...formData, max_pages: parseInt(e.target.value) || null })}
            margin="normal"
            inputProps={{ min: 1, max: 1000 }}
          />
          <TextField
            fullWidth
            label="Максимальная глубина"
            type="number"
            value={formData.max_depth || ''}
            onChange={(e) => setFormData({ ...formData, max_depth: parseInt(e.target.value) || null })}
            margin="normal"
            inputProps={{ min: 1, max: 10 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Отмена</Button>
          <Button
            onClick={handleSubmit}
            variant="contained"
            disabled={loading}
          >
            {loading ? 'Сохранение...' : 'Сохранить'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Contractors; 