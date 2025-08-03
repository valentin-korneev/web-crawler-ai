import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
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
} from '@mui/material';
import {
  Visibility as ViewIcon,
  OpenInNew as OpenInNewIcon,
  Warning as WarningIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  Info as InfoIcon,
} from '@mui/icons-material';
import { api } from '../services/api';
import { API_ENDPOINTS } from '../config/api';
import Pagination from '../components/Pagination';

interface Contractor {
  id: number;
  name: string;
  domain: string;
  total_pages: number;
  scanned_pages: number;
  violations_found: number;
  last_check: string | null;
}

interface WebPage {
  id: number;
  url: string;
  title: string | null;
  meta_description: string | null;
  status: string;
  http_status: number | null;
  response_time: number | null;
  violations_found: boolean;
  violations_count: number;
  last_scanned: string | null;
  created_at: string;
}

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
}

interface PageDetails {
  id: number;
  url: string;
  title: string | null;
  meta_description: string | null;
  status: string;
  http_status: number | null;
  response_time: number | null;
  violations_found: boolean;
  violations_count: number;
  last_scanned: string | null;
  created_at: string;
  violations: Violation[];
}

interface PaginationData {
  page: number;
  page_size: number;
  total_items: number;
  total_pages: number;
  has_next: boolean;
  has_prev: boolean;
}

const ContractorPages: React.FC = () => {
  const { contractorId } = useParams<{ contractorId: string }>();
  const [contractor, setContractor] = useState<Contractor | null>(null);
  const [pages, setPages] = useState<WebPage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedPage, setSelectedPage] = useState<PageDetails | null>(null);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const [pagination, setPagination] = useState<PaginationData>({
    page: 1,
    page_size: 20,
    total_items: 0,
    total_pages: 0,
    has_next: false,
    has_prev: false,
  });

  useEffect(() => {
    if (contractorId) {
      fetchData();
    }
  }, [contractorId, pagination.page, pagination.page_size]);

  const fetchData = async () => {
    if (!contractorId) return;

    try {
      setLoading(true);
      
      // Получаем информацию о контрагенте
      const contractorResponse = await api.get(API_ENDPOINTS.CONTRACTORS.GET(Number(contractorId)));
      setContractor(contractorResponse.data);
      
      // Получаем страницы контрагента с пагинацией
      const pagesResponse = await api.get(API_ENDPOINTS.CONTRACTORS.PAGES(Number(contractorId)), {
        params: {
          page: pagination.page,
          page_size: pagination.page_size,
        },
      });
      
      if (pagesResponse.data.items) {
        setPages(pagesResponse.data.items);
        setPagination(prev => ({
          ...prev,
          ...pagesResponse.data.pagination,
        }));
      } else {
        // Fallback for old API format
        setPages(pagesResponse.data);
      }
    } catch (err: any) {
      console.error('Error fetching data:', err);
      setError(err.response?.data?.detail || 'Ошибка загрузки данных');
    } finally {
      setLoading(false);
    }
  };

  const handlePageChange = (page: number) => {
    setPagination(prev => ({ ...prev, page }));
  };

  const handlePageSizeChange = (pageSize: number) => {
    setPagination(prev => ({ ...prev, page: 1, page_size: pageSize }));
  };

  const handleViewDetails = async (pageId: number) => {
    try {
      const response = await api.get(API_ENDPOINTS.CONTRACTORS.PAGE_DETAILS(Number(contractorId), pageId));
      setSelectedPage(response.data);
      setDetailsDialogOpen(true);
    } catch (err: any) {
      console.error('Error fetching page details:', err);
      setError(err.response?.data?.detail || 'Ошибка загрузки деталей страницы');
    }
  };

  const handleOpenPage = (url: string) => {
    window.open(url, '_blank');
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return <CheckCircleIcon color="success" />;
      case 'error':
        return <ErrorIcon color="error" />;
      case 'pending':
        return <InfoIcon color="info" />;
      default:
        return <WarningIcon color="warning" />;
    }
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

  if (!contractor) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Alert severity="error">Контрагент не найден</Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" gutterBottom>
        Страницы контрагента: {contractor.name}
      </Typography>
      
      <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
        {contractor.domain}
      </Typography>

      {/* Статистика */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={3}>
          <Card>
            <CardContent>
              <Typography variant="h6">{pagination.total_items}</Typography>
              <Typography variant="body2" color="text.secondary">
                Всего страниц
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={3}>
          <Card>
            <CardContent>
              <Typography variant="h6" color="primary">
                {pages.filter(p => p.status === 'success').length}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Успешно отсканировано
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={3}>
          <Card>
            <CardContent>
              <Typography variant="h6" color="error">
                {pages.filter(p => p.violations_found).length}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Страниц с нарушениями
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={3}>
          <Card>
            <CardContent>
              <Typography variant="h6" color="error">
                {pages.reduce((sum, p) => sum + p.violations_count, 0)}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Всего нарушений
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Таблица страниц */}
      <Paper sx={{ width: '100%', overflow: 'hidden' }}>
        <TableContainer>
          <Table stickyHeader>
            <TableHead>
              <TableRow>
                <TableCell>URL</TableCell>
                <TableCell>Заголовок</TableCell>
                <TableCell>Статус</TableCell>
                <TableCell>HTTP</TableCell>
                <TableCell>Время ответа</TableCell>
                <TableCell>Нарушения</TableCell>
                <TableCell>Последнее сканирование</TableCell>
                <TableCell>Действия</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {pages.map((page) => (
                <TableRow key={page.id} hover>
                  <TableCell>
                    <Link
                      href={page.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      sx={{ display: 'flex', alignItems: 'center', gap: 1 }}
                    >
                      {page.url}
                      <OpenInNewIcon fontSize="small" />
                    </Link>
                  </TableCell>
                  <TableCell>{page.title || '-'}</TableCell>
                  <TableCell>
                    <Box display="flex" alignItems="center" gap={1}>
                      {getStatusIcon(page.status)}
                      <Chip
                        label={page.status}
                        color={page.status === 'success' ? 'success' : 'error'}
                        size="small"
                      />
                    </Box>
                  </TableCell>
                  <TableCell>{page.http_status || '-'}</TableCell>
                  <TableCell>{page.response_time ? `${page.response_time}ms` : '-'}</TableCell>
                  <TableCell>
                    <Box display="flex" gap={1} alignItems="center">
                      <Chip
                        icon={<WarningIcon />}
                        label={page.violations_count}
                        color={page.violations_count > 0 ? 'error' : 'default'}
                        size="small"
                      />
                    </Box>
                  </TableCell>
                  <TableCell>
                    {page.last_scanned
                      ? new Date(page.last_scanned).toLocaleString()
                      : '-'}
                  </TableCell>
                  <TableCell>
                    <IconButton
                      size="small"
                      onClick={() => handleViewDetails(page.id)}
                      title="Просмотр деталей"
                    >
                      <ViewIcon />
                    </IconButton>
                    <IconButton
                      size="small"
                      onClick={() => handleOpenPage(page.url)}
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

      {/* Диалог с деталями страницы */}
      <Dialog
        open={detailsDialogOpen}
        onClose={() => setDetailsDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          Детали страницы - {selectedPage?.title || selectedPage?.url}
        </DialogTitle>
        <DialogContent>
          {selectedPage && (
            <Box>
              <Typography variant="h6" gutterBottom>
                Информация о странице
              </Typography>
              <Grid container spacing={2} sx={{ mb: 3 }}>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">
                    URL:
                  </Typography>
                  <Typography variant="body1">{selectedPage.url}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">
                    Заголовок:
                  </Typography>
                  <Typography variant="body1">{selectedPage.title || '-'}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">
                    Статус:
                  </Typography>
                  <Chip
                    label={selectedPage.status}
                    color={selectedPage.status === 'success' ? 'success' : 'error'}
                    size="small"
                  />
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">
                    HTTP статус:
                  </Typography>
                  <Typography variant="body1">{selectedPage.http_status || '-'}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">
                    Время ответа:
                  </Typography>
                  <Typography variant="body1">
                    {selectedPage.response_time ? `${selectedPage.response_time}ms` : '-'}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">
                    Последнее сканирование:
                  </Typography>
                  <Typography variant="body1">
                    {selectedPage.last_scanned
                      ? new Date(selectedPage.last_scanned).toLocaleString()
                      : '-'}
                  </Typography>
                </Grid>
              </Grid>

              {selectedPage.meta_description && (
                <Box sx={{ mb: 3 }}>
                  <Typography variant="h6" gutterBottom>
                    Meta описание
                  </Typography>
                  <Paper sx={{ p: 2, backgroundColor: 'grey.100' }}>
                    <Typography variant="body2">
                      {selectedPage.meta_description}
                    </Typography>
                  </Paper>
                </Box>
              )}

              <Typography variant="h6" gutterBottom>
                Нарушения ({selectedPage.violations.length})
              </Typography>
              
              {selectedPage.violations.length > 0 ? (
                selectedPage.violations.map((violation) => (
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
          {selectedPage && (
            <Button
              onClick={() => handleOpenPage(selectedPage.url)}
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

export default ContractorPages; 