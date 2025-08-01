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

  useEffect(() => {
    fetchSessions();
    fetchContractors();
  }, []);

  const fetchSessions = async () => {
    try {
      setLoading(true);
      const response = await api.get(API_ENDPOINTS.SCAN_SESSIONS.LIST);
      setSessions(response.data);
      setError(null);
    } catch (err) {
      setError('Ошибка при загрузке сессий сканирования');
      console.error('Error fetching sessions:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchContractors = async () => {
    try {
      const response = await api.get(API_ENDPOINTS.CONTRACTORS.LIST);
      setContractors(response.data);
    } catch (err) {
      console.error('Error fetching contractors:', err);
    }
  };

  const fetchSessionDetail = async (sessionId: number) => {
    try {
      const response = await api.get(API_ENDPOINTS.SCAN_SESSIONS.GET(sessionId));
      setSelectedSession(response.data);
      setDetailDialogOpen(true);
    } catch (err) {
      setError('Ошибка при загрузке деталей сессии');
      console.error('Error fetching session detail:', err);
    }
  };

  const handleDeleteSession = async (sessionId: number) => {
    if (!window.confirm('Вы уверены, что хотите удалить эту сессию сканирования?')) {
      return;
    }

    try {
      await api.delete(API_ENDPOINTS.SCAN_SESSIONS.DELETE(sessionId));
      await fetchSessions();
    } catch (err) {
      setError('Ошибка при удалении сессии');
      console.error('Error deleting session:', err);
    }
  };

  const handleStartSession = async () => {
    if (!selectedContractor) return;

    try {
      await api.post(API_ENDPOINTS.SCAN_SESSIONS.START(selectedContractor));
      setStartDialogOpen(false);
      setSelectedContractor(null);
      await fetchSessions();
    } catch (err) {
      setError('Ошибка при запуске сессии сканирования');
      console.error('Error starting session:', err);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'running':
        return <CircularProgress size={20} />;
      case 'completed':
        return <SuccessIcon color="success" />;
      case 'failed':
        return <ErrorIcon color="error" />;
      default:
        return <WarningIcon color="warning" />;
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
        return 'warning';
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
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box p={3}>
      {/* <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" component="h1">
          Сессии сканирования
        </Typography>
        <Button
          variant="contained"
          color="primary"
          startIcon={<StartIcon />}
          onClick={() => setStartDialogOpen(true)}
        >
          Запустить сканирование
        </Button>
      </Box> */}

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>ID</TableCell>
              <TableCell>Контрагент</TableCell>
              <TableCell>Статус</TableCell>
              <TableCell>Страниц отсканировано</TableCell>
              <TableCell>Страниц с нарушениями</TableCell>
              <TableCell>Всего нарушений</TableCell>
              <TableCell>Начало</TableCell>
              <TableCell>Длительность</TableCell>
              <TableCell>Тип</TableCell>
              <TableCell>Действия</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {sessions.map((session) => (
              <TableRow key={session.id}>
                <TableCell>{session.id}</TableCell>
                <TableCell>
                  <Box>
                    <Typography variant="body2" fontWeight="bold">
                      {session.contractor_name}
                    </Typography>
                    <Typography variant="caption" color="textSecondary">
                      {session.contractor_domain}
                    </Typography>
                  </Box>
                </TableCell>
                <TableCell>
                  <Box display="flex" alignItems="center" gap={1}>
                    {getStatusIcon(session.status)}
                    <Chip
                      label={session.status === 'running' ? 'Выполняется' : 
                             session.status === 'completed' ? 'Завершено' : 'Ошибка'}
                      color={getStatusColor(session.status) as any}
                      size="small"
                    />
                  </Box>
                  {session.error_message && (
                    <Typography variant="caption" color="error" display="block" sx={{ mt: 0.5 }}>
                      {session.error_message}
                    </Typography>
                  )}
                </TableCell>
                <TableCell>{session.pages_scanned}</TableCell>
                <TableCell>{session.pages_with_violations}</TableCell>
                <TableCell>{session.total_violations}</TableCell>
                <TableCell>
                  {new Date(session.started_at).toLocaleString('ru-RU')}
                </TableCell>
                <TableCell>
                  <Box display="flex" alignItems="center" gap={1}>
                    <TimerIcon fontSize="small" />
                    {formatDuration(session.duration)}
                  </Box>
                </TableCell>
                <TableCell>
                  <Chip
                    label="Обычное"
                    color="default"
                    size="small"
                  />
                </TableCell>
                <TableCell>
                  <Box display="flex" gap={1}>
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
                        color="error"
                        onClick={() => handleDeleteSession(session.id)}
                      >
                        <DeleteIcon />
                      </IconButton>
                    </Tooltip>
                  </Box>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Диалог запуска сканирования */}
      <Dialog open={startDialogOpen} onClose={() => setStartDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Запуск сканирования</DialogTitle>
        <DialogContent>
          <Box mb={2}>
            <TextField
              select
              fullWidth
              label="Контрагент"
              value={selectedContractor || ''}
              onChange={(e) => setSelectedContractor(Number(e.target.value))}
              margin="normal"
            >
              {contractors.map((contractor) => (
                <option key={contractor.id} value={contractor.id}>
                  {contractor.name} ({contractor.domain})
                </option>
              ))}
            </TextField>
          </Box>
                     {/* Принудительное пересканирование больше не нужно - любое сканирование создает новую сессию */}
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
          Детали сессии сканирования #{selectedSession?.id}
        </DialogTitle>
        <DialogContent>
          {selectedSession && (
            <Box>
              <Grid container spacing={2} mb={3}>
                <Grid item xs={12} md={6}>
                  <Card>
                    <CardContent>
                      <Typography variant="h6" gutterBottom>
                        Информация о сессии
                      </Typography>
                      <Typography><strong>Контрагент:</strong> {selectedSession.contractor_name}</Typography>
                      <Typography><strong>Домен:</strong> {selectedSession.contractor_domain}</Typography>
                      <Typography><strong>Статус:</strong> {selectedSession.status}</Typography>
                      <Typography><strong>Начало:</strong> {new Date(selectedSession.started_at).toLocaleString('ru-RU')}</Typography>
                      {selectedSession.completed_at && (
                        <Typography><strong>Завершение:</strong> {new Date(selectedSession.completed_at).toLocaleString('ru-RU')}</Typography>
                      )}
                      <Typography><strong>Длительность:</strong> {formatDuration(selectedSession.duration)}</Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Card>
                    <CardContent>
                      <Typography variant="h6" gutterBottom>
                        Статистика
                      </Typography>
                      <Typography><strong>Страниц отсканировано:</strong> {selectedSession.pages_scanned}</Typography>
                      <Typography><strong>Страниц с нарушениями:</strong> {selectedSession.pages_with_violations}</Typography>
                      <Typography><strong>Всего нарушений:</strong> {selectedSession.total_violations}</Typography>
                      {selectedSession.error_message && (
                        <Alert severity="error" sx={{ mt: 2 }}>
                          <Typography variant="subtitle2" gutterBottom>
                            <strong>Ошибка:</strong>
                          </Typography>
                          <Typography variant="body2">
                            {selectedSession.error_message}
                          </Typography>
                        </Alert>
                      )}
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>

              <Typography variant="h6" gutterBottom>
                Страницы ({selectedSession.pages.length})
              </Typography>
              <TableContainer component={Paper}>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>URL</TableCell>
                      <TableCell>Заголовок</TableCell>
                      <TableCell>Статус</TableCell>
                      <TableCell>Нарушения</TableCell>
                      <TableCell>Последнее сканирование</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {selectedSession.pages.map((page) => (
                      <TableRow key={page.id}>
                        <TableCell>
                          <a href={page.url} target="_blank" rel="noopener noreferrer">
                            {page.url}
                          </a>
                        </TableCell>
                        <TableCell>{page.title || '-'}</TableCell>
                        <TableCell>
                          <Chip
                            label={page.status}
                            color={page.status === 'completed' ? 'success' : 'warning'}
                            size="small"
                          />
                        </TableCell>
                        <TableCell>
                          {page.violations_found ? (
                            <Chip
                              label={`${page.violations_count} нарушений`}
                              color="error"
                              size="small"
                            />
                          ) : (
                            <Chip label="Нет нарушений" color="success" size="small" />
                          )}
                        </TableCell>
                        <TableCell>
                          {page.last_scanned ? new Date(page.last_scanned).toLocaleString('ru-RU') : '-'}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
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