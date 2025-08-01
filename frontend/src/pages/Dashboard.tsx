import React, { useState, useEffect } from 'react';
import {
  Grid,
  Card,
  CardContent,
  Typography,
  Box,
  Paper,
  Button,
  CircularProgress,
  Alert
} from '@mui/material';
import {
  Business as BusinessIcon,
  Block as BlockIcon,
  Assessment as AssessmentIcon,
  Warning as WarningIcon,
  Login as LoginIcon
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { API_ENDPOINTS } from '../config/api';

interface DashboardStats {
  contractors: number;
  forbidden_words: number;
  scanned_pages: number;
  violations: number;
  total_violations_by_contractors: number;
  total_scanned_pages_by_contractors: number;
}

const Dashboard: React.FC = () => {
  const { isAuthenticated, user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isAuthenticated) {
      fetchStats();
    }
  }, [isAuthenticated]);

  const fetchStats = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.get(API_ENDPOINTS.DASHBOARD.STATS);
      setStats(response.data);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Ошибка загрузки статистики');
      console.error('Error fetching dashboard stats:', err);
    } finally {
      setLoading(false);
    }
  };

  const StatCard: React.FC<{ title: string; value: number; icon: React.ReactNode; color: string }> = ({ title, value, icon, color }) => (
    <Card sx={{ height: '100%' }}>
      <CardContent>
        <Box display="flex" alignItems="center" justifyContent="space-between">
          <Box>
            <Typography color="textSecondary" gutterBottom>
              {title}
            </Typography>
            <Typography variant="h4" component="div">
              {loading ? <CircularProgress size={24} /> : value}
            </Typography>
          </Box>
          <Box sx={{ color }}>
            {icon}
          </Box>
        </Box>
      </CardContent>
    </Card>
  );

  if (!isAuthenticated) {
    return (
      <Box sx={{ textAlign: 'center', py: 8 }}>
        <Typography variant="h3" gutterBottom>
          Добро пожаловать в Huginn
        </Typography>
        <Typography variant="h6" color="textSecondary" sx={{ mb: 4 }}>
          Система проверки контрагентов банка
        </Typography>
        <Typography variant="body1" color="textSecondary" sx={{ mb: 4, maxWidth: 600, mx: 'auto' }}>
          Для доступа к системе необходимо войти в свой аккаунт. 
          Используйте кнопку "Войти" в правом верхнем углу или нажмите кнопку ниже.
        </Typography>
        <Button
          variant="contained"
          size="large"
          startIcon={<LoginIcon />}
          onClick={() => navigate('/login')}
        >
          Войти в систему
        </Button>
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Дашборд
      </Typography>
      
      <Typography variant="h6" color="textSecondary" sx={{ mb: 3 }}>
        Добро пожаловать, {user?.full_name || user?.username}!
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}
      
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Контрагенты"
            value={stats?.contractors || 0}
            icon={<BusinessIcon fontSize="large" />}
            color="primary.main"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Запрещенные слова"
            value={stats?.forbidden_words || 0}
            icon={<BlockIcon fontSize="large" />}
            color="error.main"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Отсканированные страницы"
            value={stats?.scanned_pages || 0}
            icon={<AssessmentIcon fontSize="large" />}
            color="info.main"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Нарушения"
            value={stats?.violations || 0}
            icon={<WarningIcon fontSize="large" />}
            color="warning.main"
          />
        </Grid>
      </Grid>

      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Статистика контрагентов
            </Typography>
            <Typography variant="body2" color="textSecondary" gutterBottom>
              Нарушений по контрагентам: {stats?.total_violations_by_contractors || 0}
            </Typography>
            <Typography variant="body2" color="textSecondary">
              Отсканированных страниц: {stats?.total_scanned_pages_by_contractors || 0}
            </Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Активность
            </Typography>
            <Typography color="textSecondary">
              Здесь будет график активности системы
            </Typography>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Dashboard; 