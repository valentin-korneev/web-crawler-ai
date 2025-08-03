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
import Pagination from '../components/Pagination';
import { API_ENDPOINTS } from '../config/api';

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

interface PaginationData {
  page: number;
  page_size: number;
  total_items: number;
  total_pages: number;
  has_next: boolean;
  has_prev: boolean;
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
  const [pagination, setPagination] = useState<PaginationData>({
    page: 1,
    page_size: 20,
    total_items: 0,
    total_pages: 0,
    has_next: false,
    has_prev: false,
  });

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
  }, [pagination.page, pagination.page_size]);

  const fetchContractors = async () => {
    try {
      setFetching(true);
      const response = await api.get(API_ENDPOINTS.CONTRACTORS.LIST, {
        params: {
          page: pagination.page,
          page_size: pagination.page_size,
        },
      });
      
      if (response.data.items) {
        setContractors(response.data.items);
        setPagination(prev => ({
          ...prev,
          ...response.data.pagination,
        }));
      } else {
        // Fallback for old API format
        setContractors(response.data);
      }
    } catch (err: any) {
      console.error('Error fetching contractors:', err);
      setError(err.response?.data?.detail || 'Ошибка загрузки данных');
    } finally {
      setFetching(false);
    }
  };

  const handlePageChange = (page: number) => {
    setPagination(prev => ({ ...prev, page }));
  };

  const handlePageSizeChange = (pageSize: number) => {
    setPagination(prev => ({ ...prev, page: 1, page_size: pageSize }));
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
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingContractor(null);
    setFormData({
      name: '',
      domain: '',
      description: '',
      check_schedule: 'daily',
      max_pages: 100,
      max_depth: 3,
    });
  };

  const handleSubmit = async () => {
    if (!formData.name || !formData.domain) {
      setError('Пожалуйста, заполните обязательные поля');
      return;
    }

    try {
      setLoading(true);
      if (editingContractor) {
        await api.put(API_ENDPOINTS.CONTRACTORS.UPDATE(editingContractor.id), formData);
      } else {
        await api.post(API_ENDPOINTS.CONTRACTORS.CREATE, formData);
      }
      handleCloseDialog();
      fetchContractors();
    } catch (err: any) {
      console.error('Error saving contractor:', err);
      setError(err.response?.data?.detail || 'Ошибка сохранения контрагента');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteContractor = async (contractorId: number) => {
    if (!window.confirm('Вы уверены, что хотите удалить этого контрагента?')) {
      return;
    }

    try {
      await api.delete(API_ENDPOINTS.CONTRACTORS.DELETE(contractorId));
      fetchContractors();
    } catch (err: any) {
      console.error('Error deleting contractor:', err);
      setError(err.response?.data?.detail || 'Ошибка удаления контрагента');
    }
  };

  const handleStartScan = async (contractorId: number) => {
    try {
      await api.post(API_ENDPOINTS.CONTRACTORS.SCAN(contractorId));
      // Обновляем список контрагентов после запуска сканирования
      fetchContractors();
    } catch (err: any) {
      console.error('Error starting scan:', err);
      setError(err.response?.data?.detail || 'Ошибка запуска сканирования');
    }
  };

  const handleViewPages = (contractorId: number) => {
    navigate(`/contractors/${contractorId}/pages`);
  };

  if (fetching) {
    return (
      <Box p={3}>
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
          <Typography>Загрузка контрагентов...</Typography>
        </Box>
      </Box>
    );
  }

  return (
    <Box p={3}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" component="h1">Контрагенты</Typography>
        <Button
          variant="contained"
          color="primary"
          startIcon={<AddIcon />}
          onClick={() => handleOpenDialog()}
        >
          Добавить контрагента
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      <Paper sx={{ width: '100%', overflow: 'hidden' }}>
        <TableContainer>
          <Table stickyHeader>
            <TableHead>
              <TableRow>
                <TableCell>ID</TableCell>
                <TableCell>Название</TableCell>
                <TableCell>Домен</TableCell>
                <TableCell>Статус</TableCell>
                <TableCell>Всего страниц</TableCell>
                <TableCell>Отсканировано</TableCell>
                <TableCell>Нарушений</TableCell>
                <TableCell>Последняя проверка</TableCell>
                <TableCell>Действия</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {contractors.map((contractor) => (
                <TableRow key={contractor.id} hover>
                  <TableCell>{contractor.id}</TableCell>
                  <TableCell>
                    <Box>
                      <Typography variant="body2" fontWeight="bold">
                        {contractor.name}
                      </Typography>
                      {contractor.description && (
                        <Typography variant="body2" color="text.secondary">
                          {contractor.description}
                        </Typography>
                      )}
                    </Box>
                  </TableCell>
                  <TableCell>{contractor.domain}</TableCell>
                  <TableCell>
                    <Box
                      sx={{
                        width: 8,
                        height: 8,
                        borderRadius: '50%',
                        backgroundColor: contractor.is_active ? 'success.main' : 'error.main',
                        display: 'inline-block',
                        mr: 1,
                      }}
                    />
                    {contractor.is_active ? 'Активен' : 'Неактивен'}
                  </TableCell>
                  <TableCell>{contractor.total_pages || 0}</TableCell>
                  <TableCell>{contractor.scanned_pages || 0}</TableCell>
                  <TableCell>
                    <Box display="flex" alignItems="center" gap={1}>
                      <Typography variant="body2" color="error">
                        {contractor.violations_found || 0}
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell>
                    {contractor.last_check
                      ? new Date(contractor.last_check).toLocaleString()
                      : 'Никогда'}
                  </TableCell>
                  <TableCell>
                    <Box display="flex" gap={1}>
                      <IconButton
                        size="small"
                        onClick={() => handleStartScan(contractor.id)}
                        title="Запустить сканирование"
                      >
                        <ScanIcon />
                      </IconButton>
                      <IconButton
                        size="small"
                        onClick={() => handleViewPages(contractor.id)}
                        title="Просмотр страниц"
                      >
                        <ViewPagesIcon />
                      </IconButton>
                      <IconButton
                        size="small"
                        onClick={() => handleOpenDialog(contractor)}
                        title="Редактировать"
                      >
                        <EditIcon />
                      </IconButton>
                      <IconButton
                        size="small"
                        onClick={() => handleDeleteContractor(contractor.id)}
                        title="Удалить"
                        color="error"
                      >
                        <DeleteIcon />
                      </IconButton>
                    </Box>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
        
        {/* Пагинация */}
        <Pagination
          page={pagination.page}
          pageSize={pagination.page_size}
          totalItems={pagination.total_items}
          totalPages={pagination.total_pages}
          hasNext={pagination.has_next}
          hasPrev={pagination.has_prev}
          onPageChange={handlePageChange}
          onPageSizeChange={handlePageSizeChange}
        />
      </Paper>

      {/* Диалог добавления/редактирования контрагента */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>
          {editingContractor ? 'Редактировать контрагента' : 'Добавить контрагента'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 1 }}>
            <TextField
              fullWidth
              label="Название *"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              margin="normal"
            />
            <TextField
              fullWidth
              label="Домен *"
              value={formData.domain}
              onChange={(e) => setFormData({ ...formData, domain: e.target.value })}
              margin="normal"
              placeholder="example.com"
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
                <MenuItem value="never">Никогда</MenuItem>
              </Select>
            </FormControl>
            <TextField
              fullWidth
              label="Максимум страниц"
              type="number"
              value={formData.max_pages || ''}
              onChange={(e) => setFormData({ ...formData, max_pages: e.target.value ? Number(e.target.value) : null })}
              margin="normal"
            />
            <TextField
              fullWidth
              label="Максимальная глубина"
              type="number"
              value={formData.max_depth || ''}
              onChange={(e) => setFormData({ ...formData, max_depth: e.target.value ? Number(e.target.value) : null })}
              margin="normal"
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Отмена</Button>
          <Button
            onClick={handleSubmit}
            variant="contained"
            disabled={loading}
          >
            {loading ? 'Сохранение...' : editingContractor ? 'Сохранить' : 'Добавить'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Contractors; 