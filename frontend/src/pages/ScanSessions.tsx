import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Chip,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControlLabel,
  Switch,
  Alert,
  CircularProgress,
  Card,
  CardContent,
  Grid,
  Tooltip
} from '@mui/material';
import {
  Delete as DeleteIcon,
  Visibility as ViewIcon,
  PlayArrow as StartIcon,
  Refresh as RescanIcon,
  Timer as TimerIcon,
  Warning as WarningIcon,
  CheckCircle as SuccessIcon,
  Error as ErrorIcon
} from '@mui/icons-material';
import { api } from '../services/api';
import { API_ENDPOINTS } from '../config/api';
import Pagination from '../components/Pagination';

interface ScanSession {
  id: number;
  contractor_id: number;
  contractor_name: string;
  contractor_domain: string;
  status: 'running' | 'completed' | 'failed';
  pages_scanned: number;
  pages_with_violations: number;
  total_violations: number;
  started_at: string;
  completed_at: string | null;
  duration: number | null;
  error_message: string | null;
}

interface ScanSessionDetail {
  id: number;
  contractor_id: number;
  contractor_name: string;
  contractor_domain: string;
  status: string;
  pages_scanned: number;
  pages_with_violations: number;
  total_violations: number;
  started_at: string;
  completed_at: string | null;
  duration: number | null;
  error_message: string | null;
  pages: Array<{
    id: number;
    url: string;
    title: string | null;
    status: string;
    http_status: number | null;
    response_time: number | null;
    violations_found: boolean;
    violations_count: number;
    last_scanned: string | null;
    violations: Array<{
      id: number;
      word_found: string;
      context: string;
      position: number;
      severity: string;
      forbidden_word_word: string;
      forbidden_word_category: string;
    }>;
  }>;
  pagination?: {
    page: number;
    page_size: number;
    total_items: number;
    total_pages: number;
    has_next: boolean;
    has_prev: boolean;
  };
}

interface PaginationData {
  page: number;
  page_size: number;
  total_items: number;
  total_pages: number;
  has_next: boolean;
  has_prev: boolean;
}

const ScanSessions: React.FC = () => {
  const [sessions, setSessions] = useState<ScanSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedSession, setSelectedSession] = useState<ScanSessionDetail | null>(null);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [startDialogOpen, setStartDialogOpen] = useState(false);
  const [selectedContractor, setSelectedContractor] = useState<number | null>(null);
  const [contractors, setContractors] = useState<Array<{ id: number; name: string; domain: string }>>([]);
  const [pagination, setPagination] = useState<PaginationData>({
    page: 1,
    page_size: 20,
    total_items: 0,
    total_pages: 0,
    has_next: false,
    has_prev: false,
  });
  const [sessionPagination, setSessionPagination] = useState<PaginationData>({
    page: 1,
    page_size: 20,
    total_items: 0,
    total_pages: 0,
    has_next: false,
    has_prev: false,
  });

  useEffect(() => {
    fetchSessions();
    fetchContractors();
  }, [pagination.page, pagination.page_size]);

  const fetchSessions = async () => {
    try {
      setLoading(true);
      const response = await api.get(API_ENDPOINTS.SCAN_SESSIONS.LIST, {
        params: {
          page: pagination.page,
          page_size: pagination.page_size,
        },
      });
      
      if (response.data.items) {
        setSessions(response.data.items);
        setPagination(prev => ({
          ...prev,
          ...response.data.pagination,
        }));
      } else {
        // Fallback for old API format
        setSessions(response.data);
      }
    } catch (err: any) {
      console.error('Error fetching sessions:', err);
      setError(err.response?.data?.detail || 'Ошибка загрузки данных');
    } finally {
      setLoading(false);
    }
  };

  const fetchContractors = async () => {
    try {
      const response = await api.get(API_ENDPOINTS.CONTRACTORS.GET);
      setContractors(response.data.items || response.data);
    } catch (err: any) {
      console.error('Error fetching contractors:', err);
    }
  };

  const fetchSessionDetail = async (sessionId: number, page: number = 1, pageSize: number = 20) => {
    try {
      const response = await api.get(API_ENDPOINTS.SCAN_SESSIONS.GET(sessionId), {
        params: {
          page,
          page_size: pageSize,
        },
      });
      
      if (response.data.pagination) {
        setSessionPagination(response.data.pagination);
      }
      
      setSelectedSession(response.data);
      setDetailDialogOpen(true);
    } catch (err: any) {
      console.error('Error fetching session detail:', err);
      setError(err.response?.data?.detail || 'Ошибка загрузки деталей сессии');
    }
  };

  const handlePageChange = (page: number) => {
    setPagination(prev => ({ ...prev, page }));
  };

  const handlePageSizeChange = (pageSize: number) => {
    setPagination(prev => ({ ...prev, page: 1, page_size: pageSize }));
  };

  const handleSessionPageChange = (page: number) => {
    if (selectedSession) {
      fetchSessionDetail(selectedSession.id, page, sessionPagination.page_size);
    }
  };

  const handleSessionPageSizeChange = (pageSize: number) => {
    if (selectedSession) {
      fetchSessionDetail(selectedSession.id, 1, pageSize);
    }
  };

  const handleDeleteSession = async (sessionId: number) => {
    if (window.confirm('Вы уверены, что хотите удалить эту сессию?')) {
      try {
        await api.delete(API_ENDPOINTS.SCAN_SESSIONS.DELETE(sessionId));
        fetchSessions();
      } catch (err: any) {
        console.error('Error deleting session:', err);
        setError(err.response?.data?.detail || 'Ошибка удаления сессии');
      }
    }
  };

  const handleStartSession = async () => {
    if (!selectedContractor) return;
    
    try {
      await api.post(API_ENDPOINTS.SCAN_SESSIONS.START(selectedContractor));
      setStartDialogOpen(false);
      setSelectedContractor(null);
      fetchSessions();
    } catch (err: any) {
      console.error('Error starting session:', err);
      setError(err.response?.data?.detail || 'Ошибка запуска сессии');
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'running':
        return <TimerIcon color="primary" />;
      case 'completed':
        return <SuccessIcon color="success" />;
      case 'failed':
        return <ErrorIcon color="error" />;
      default:
        return <WarningIcon />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'running':
        return 'primary';
      case 'completed':
        return 'success';
      case 'failed':
        return 'error';
      default:
        return 'default';
    }
  };

  const formatDuration = (seconds: number | null) => {
    if (!seconds) return '-';
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours}ч ${minutes}м ${secs}с`;
    } else if (minutes > 0) {
      return `${minutes}м ${secs}с`;
    } else {
      return `${secs}с`;
    }
  };

  if (loading) {
    return (
      <Box p={3}>
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
          <CircularProgress />
        </Box>
      </Box>
    );
  }

  return (
    <Box p={3}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" component="h1">Сессии сканирования</Typography>
        <Button variant="contained" color="primary" startIcon={<StartIcon />} onClick={() => setStartDialogOpen(true)}>
          Запустить сканирование
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      <Paper sx={{ width: '100%', overflow: 'hidden' }}>
        <TableContainer>
          <Table stickyHeader>
            <TableHead>
              <TableRow>
                <TableCell>ID</TableCell>
                <TableCell>Контрагент</TableCell>
                <TableCell>Статус</TableCell>
                <TableCell>Страниц отсканировано</TableCell>
                <TableCell>Страниц с нарушениями</TableCell>
                <TableCell>Нарушений</TableCell>
                <TableCell>Начало</TableCell>
                <TableCell>Длительность</TableCell>
                <TableCell>Действия</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {sessions.map((session) => (
                <TableRow key={session.id} hover>
                  <TableCell>{session.id}</TableCell>
                  <TableCell>
                    <Box>
                      <Typography variant="body2" fontWeight="bold">
                        {session.contractor_name}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {session.contractor_domain}
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Chip
                      icon={getStatusIcon(session.status)}
                      label={session.status === 'running' ? 'Выполняется' : 
                             session.status === 'completed' ? 'Завершено' : 'Ошибка'}
                      color={getStatusColor(session.status) as any}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>{session.pages_scanned}</TableCell>
                  <TableCell>
                    <Chip
                      label={session.pages_with_violations}
                      color={session.pages_with_violations > 0 ? 'error' : 'default'}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={session.total_violations}
                      color={session.total_violations > 0 ? 'error' : 'default'}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    {new Date(session.started_at).toLocaleString()}
                  </TableCell>
                  <TableCell>
                    {formatDuration(session.duration)}
                  </TableCell>
                  <TableCell>
                    <Tooltip title="Просмотр деталей">
                      <IconButton
                        size="small"
                        onClick={() => fetchSessionDetail(session.id)}
                      >
                        <ViewIcon />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Удалить сессию">
                      <IconButton
                        size="small"
                        onClick={() => handleDeleteSession(session.id)}
                        color="error"
                      >
                        <DeleteIcon />
                      </IconButton>
                    </Tooltip>
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

      {/* Диалог запуска сканирования */}
      <Dialog open={startDialogOpen} onClose={() => setStartDialogOpen(false)}>
        <DialogTitle>Запуск сканирования</DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ mb: 2 }}>
            Выберите контрагента для сканирования:
          </Typography>
          <TextField
            select
            fullWidth
            label="Контрагент"
            value={selectedContractor || ''}
            onChange={(e) => setSelectedContractor(Number(e.target.value))}
          >
            {contractors.map((contractor) => (
              <option key={contractor.id} value={contractor.id}>
                {contractor.name} ({contractor.domain})
              </option>
            ))}
          </TextField>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setStartDialogOpen(false)}>Отмена</Button>
          <Button 
            onClick={handleStartSession} 
            variant="contained" 
            disabled={!selectedContractor}
          >
            Запустить
          </Button>
        </DialogActions>
      </Dialog>

      {/* Диалог деталей сессии */}
      <Dialog
        open={detailDialogOpen}
        onClose={() => setDetailDialogOpen(false)}
        maxWidth="lg"
        fullWidth
      >
        <DialogTitle>
          Детали сессии #{selectedSession?.id} - {selectedSession?.contractor_name}
        </DialogTitle>
        <DialogContent>
          {selectedSession && (
            <Box>
              <Grid container spacing={2} sx={{ mb: 3 }}>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">
                    Контрагент:
                  </Typography>
                  <Typography variant="body1">{selectedSession.contractor_name}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">
                    Статус:
                  </Typography>
                  <Chip
                    icon={getStatusIcon(selectedSession.status)}
                    label={selectedSession.status === 'running' ? 'Выполняется' : 
                           selectedSession.status === 'completed' ? 'Завершено' : 'Ошибка'}
                    color={getStatusColor(selectedSession.status) as any}
                    size="small"
                  />
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">
                    Начало:
                  </Typography>
                  <Typography variant="body1">
                    {new Date(selectedSession.started_at).toLocaleString()}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">
                    Длительность:
                  </Typography>
                  <Typography variant="body1">
                    {formatDuration(selectedSession.duration)}
                  </Typography>
                </Grid>
                <Grid item xs={4}>
                  <Typography variant="body2" color="text.secondary">
                    Страниц отсканировано:
                  </Typography>
                  <Typography variant="body1">{selectedSession.pages_scanned}</Typography>
                </Grid>
                <Grid item xs={4}>
                  <Typography variant="body2" color="text.secondary">
                    Страниц с нарушениями:
                  </Typography>
                  <Typography variant="body1" color="error">
                    {selectedSession.pages_with_violations}
                  </Typography>
                </Grid>
                <Grid item xs={4}>
                  <Typography variant="body2" color="text.secondary">
                    Всего нарушений:
                  </Typography>
                  <Typography variant="body1" color="error">
                    {selectedSession.total_violations}
                  </Typography>
                </Grid>
              </Grid>

              {selectedSession.error_message && (
                <Alert severity="error" sx={{ mb: 2 }}>
                  {selectedSession.error_message}
                </Alert>
              )}

              <Typography variant="h6" gutterBottom>
                Страницы ({selectedSession.pages.length})
              </Typography>
              
              <Paper sx={{ width: '100%', overflow: 'hidden' }}>
                <TableContainer>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>URL</TableCell>
                        <TableCell>Статус</TableCell>
                        <TableCell>HTTP</TableCell>
                        <TableCell>Время ответа</TableCell>
                        <TableCell>Нарушения</TableCell>
                        <TableCell>Последнее сканирование</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {selectedSession.pages.map((page) => (
                        <TableRow key={page.id} hover>
                          <TableCell>
                            <Typography variant="body2" sx={{ wordBreak: 'break-all' }}>
                              {page.url}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Chip
                              label={page.status}
                              color={page.status === 'success' ? 'success' : 'error'}
                              size="small"
                            />
                          </TableCell>
                          <TableCell>{page.http_status || '-'}</TableCell>
                          <TableCell>{page.response_time ? `${page.response_time}ms` : '-'}</TableCell>
                          <TableCell>
                            <Chip
                              label={page.violations_count}
                              color={page.violations_count > 0 ? 'error' : 'default'}
                              size="small"
                            />
                          </TableCell>
                          <TableCell>
                            {page.last_scanned
                              ? new Date(page.last_scanned).toLocaleString()
                              : '-'}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
                
                {/* Пагинация для страниц сессии */}
                {selectedSession.pagination && (
                  <Pagination
                    page={selectedSession.pagination.page}
                    pageSize={selectedSession.pagination.page_size}
                    totalItems={selectedSession.pagination.total_items}
                    totalPages={selectedSession.pagination.total_pages}
                    hasNext={selectedSession.pagination.has_next}
                    hasPrev={selectedSession.pagination.has_prev}
                    onPageChange={handleSessionPageChange}
                    onPageSizeChange={handleSessionPageSizeChange}
                  />
                )}
              </Paper>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDetailDialogOpen(false)}>Закрыть</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ScanSessions; 