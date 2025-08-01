import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Card,
  CardContent,
  Grid,
  Link,
  Alert,
  CircularProgress,
  TextField,
  InputAdornment,
} from '@mui/material';
import {
  Visibility as ViewIcon,
  OpenInNew as OpenInNewIcon,
  Warning as WarningIcon,
  Search as SearchIcon,
  FilterList as FilterIcon,
} from '@mui/icons-material';
import { api } from '../services/api';
import { API_ENDPOINTS } from '../config/api';

interface Violation {
  id: number;
  word_found: string;
  context: string;
  position: number;
  severity: string;
  forbidden_word_id: number;
  forbidden_word_word: string;
  forbidden_word_category: string;
  forbidden_word_description: string | null;
  created_at: string;
  webpage: {
    id: number;
    url: string;
    title: string | null;
    contractor: {
      id: number;
      name: string;
      domain: string;
    };
  };
}

interface ScanResult {
  id: number;
  url: string;
  title: string | null;
  contractor_name: string;
  contractor_domain: string;
  violations_count: number;
  last_scanned: string | null;
  violations: Violation[];
}

const ScanResults: React.FC = () => {
  const [results, setResults] = useState<ScanResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedResult, setSelectedResult] = useState<ScanResult | null>(null);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterSeverity, setFilterSeverity] = useState<string>('all');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const response = await api.get(API_ENDPOINTS.SCAN_RESULTS.LIST);
      console.log('Scan results response:', response.data);
      setResults(response.data);
    } catch (err: any) {
      console.error('Error fetching scan results:', err);
      setError(err.response?.data?.detail || 'Ошибка загрузки данных');
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetails = (result: ScanResult) => {
    setSelectedResult(result);
    setDetailsDialogOpen(true);
  };

  const handleOpenPage = (url: string) => {
    window.open(url, '_blank');
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high':
        return 'error';
      case 'medium':
        return 'warning';
      case 'low':
        return 'info';
      default:
        return 'default';
    }
  };

  const filteredResults = results.filter(result => {
    const matchesSearch = 
      result.url.toLowerCase().includes(searchTerm.toLowerCase()) ||
      result.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      result.contractor_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      result.contractor_domain.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesSeverity = filterSeverity === 'all' || 
      result.violations.some(v => v.severity === filterSeverity);
    
    return matchesSearch && matchesSeverity;
  });

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  if (error) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Alert severity="error">{error}</Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" gutterBottom>
        Результаты сканирования
      </Typography>
      
      <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
        Все найденные нарушения по всем контрагентам
      </Typography>

      {/* Фильтры */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              placeholder="Поиск по URL, заголовку или контрагенту..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                ),
              }}
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <Box display="flex" gap={1}>
              <Chip
                label="Все"
                onClick={() => setFilterSeverity('all')}
                color={filterSeverity === 'all' ? 'primary' : 'default'}
                variant={filterSeverity === 'all' ? 'filled' : 'outlined'}
              />
              <Chip
                label="Высокая"
                onClick={() => setFilterSeverity('high')}
                color={filterSeverity === 'high' ? 'error' : 'default'}
                variant={filterSeverity === 'high' ? 'filled' : 'outlined'}
              />
              <Chip
                label="Средняя"
                onClick={() => setFilterSeverity('medium')}
                color={filterSeverity === 'medium' ? 'warning' : 'default'}
                variant={filterSeverity === 'medium' ? 'filled' : 'outlined'}
              />
              <Chip
                label="Низкая"
                onClick={() => setFilterSeverity('low')}
                color={filterSeverity === 'low' ? 'info' : 'default'}
                variant={filterSeverity === 'low' ? 'filled' : 'outlined'}
              />
            </Box>
          </Grid>
        </Grid>
      </Paper>

      {/* Статистика */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={3}>
          <Card>
            <CardContent>
              <Typography variant="h6">{results.length}</Typography>
              <Typography variant="body2" color="text.secondary">
                Всего страниц с нарушениями
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={3}>
          <Card>
            <CardContent>
              <Typography variant="h6" color="error">
                {results.reduce((sum, r) => sum + r.violations_count, 0)}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Всего нарушений
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={3}>
          <Card>
            <CardContent>
              <Typography variant="h6">
                {new Set(results.map(r => r.contractor_name)).size}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Затронутых контрагентов
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={3}>
          <Card>
            <CardContent>
              <Typography variant="h6">
                {results.filter(r => r.violations.some(v => v.severity === 'high')).length}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Критических нарушений
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Таблица результатов */}
      <Paper sx={{ width: '100%', overflow: 'hidden' }}>
        <TableContainer>
          <Table stickyHeader>
            <TableHead>
              <TableRow>
                <TableCell>Контрагент</TableCell>
                <TableCell>URL</TableCell>
                <TableCell>Заголовок</TableCell>
                <TableCell>Нарушения</TableCell>
                <TableCell>Последнее сканирование</TableCell>
                <TableCell>Действия</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredResults.map((result) => (
                <TableRow key={result.id} hover>
                  <TableCell>
                    <Box>
                      <Typography variant="body2" fontWeight="bold">
                        {result.contractor_name}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {result.contractor_domain}
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Link
                      href={result.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      sx={{ display: 'flex', alignItems: 'center', gap: 1 }}
                    >
                      {result.url}
                      <OpenInNewIcon fontSize="small" />
                    </Link>
                  </TableCell>
                  <TableCell>{result.title || '-'}</TableCell>
                  <TableCell>
                    <Box display="flex" gap={1} alignItems="center">
                      <Chip
                        icon={<WarningIcon />}
                        label={result.violations_count}
                        color="error"
                        size="small"
                      />
                      <Box display="flex" gap={0.5}>
                        {result.violations.slice(0, 3).map((violation, index) => (
                          <Chip
                            key={index}
                            label={violation.severity}
                            color={getSeverityColor(violation.severity) as any}
                            size="small"
                            variant="outlined"
                          />
                        ))}
                        {result.violations.length > 3 && (
                          <Chip
                            label={`+${result.violations.length - 3}`}
                            size="small"
                            variant="outlined"
                          />
                        )}
                      </Box>
                    </Box>
                  </TableCell>
                  <TableCell>
                    {result.last_scanned
                      ? new Date(result.last_scanned).toLocaleString()
                      : '-'}
                  </TableCell>
                  <TableCell>
                    <IconButton
                      size="small"
                      onClick={() => handleViewDetails(result)}
                      title="Просмотр деталей"
                    >
                      <ViewIcon />
                    </IconButton>
                    <IconButton
                      size="small"
                      onClick={() => handleOpenPage(result.url)}
                      title="Открыть страницу"
                    >
                      <OpenInNewIcon />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      {/* Диалог с деталями нарушений */}
      <Dialog
        open={detailsDialogOpen}
        onClose={() => setDetailsDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          Детали нарушений - {selectedResult?.title || selectedResult?.url}
        </DialogTitle>
        <DialogContent>
          {selectedResult && (
            <Box>
              <Typography variant="h6" gutterBottom>
                Информация о странице
              </Typography>
              <Grid container spacing={2} sx={{ mb: 3 }}>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">
                    Контрагент:
                  </Typography>
                  <Typography variant="body1">{selectedResult.contractor_name}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">
                    URL:
                  </Typography>
                  <Typography variant="body1">{selectedResult.url}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">
                    Заголовок:
                  </Typography>
                  <Typography variant="body1">{selectedResult.title || '-'}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">
                    Последнее сканирование:
                  </Typography>
                  <Typography variant="body1">
                    {selectedResult.last_scanned
                      ? new Date(selectedResult.last_scanned).toLocaleString()
                      : '-'}
                  </Typography>
                </Grid>
              </Grid>

              <Typography variant="h6" gutterBottom>
                Нарушения ({selectedResult.violations.length})
              </Typography>
              
              {selectedResult.violations.length > 0 ? (
                selectedResult.violations.map((violation) => (
                  <Card key={violation.id} sx={{ mb: 2 }}>
                    <CardContent>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                        <Typography variant="h6" color="error">
                          {violation.word_found}
                        </Typography>
                        <Chip
                          label={violation.severity}
                          color={getSeverityColor(violation.severity) as any}
                          size="small"
                        />
                      </Box>
                      
                      <Typography variant="body2" color="text.secondary" gutterBottom>
                        Категория: {violation.forbidden_word_category}
                      </Typography>
                      
                      {violation.forbidden_word_description && (
                        <Typography variant="body2" color="text.secondary" gutterBottom>
                          Описание: {violation.forbidden_word_description}
                        </Typography>
                      )}
                      
                      <Typography variant="body2" sx={{ mt: 1 }}>
                        <strong>Контекст:</strong>
                      </Typography>
                      <Paper sx={{ p: 1, mt: 1, backgroundColor: 'grey.100' }}>
                        <Typography variant="body2" fontFamily="monospace">
                          {violation.context}
                        </Typography>
                      </Paper>
                      
                      <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                        Позиция: {violation.position}
                      </Typography>
                    </CardContent>
                  </Card>
                ))
              ) : (
                <Alert severity="success">
                  На этой странице не найдено нарушений
                </Alert>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDetailsDialogOpen(false)}>Закрыть</Button>
          {selectedResult && (
            <Button
              onClick={() => handleOpenPage(selectedResult.url)}
              startIcon={<OpenInNewIcon />}
            >
              Открыть страницу
            </Button>
          )}
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default ScanResults; 