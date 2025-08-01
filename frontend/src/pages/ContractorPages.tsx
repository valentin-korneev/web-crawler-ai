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

const ContractorPages: React.FC = () => {
  const { contractorId } = useParams<{ contractorId: string }>();
  const [contractor, setContractor] = useState<Contractor | null>(null);
  const [pages, setPages] = useState<WebPage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedPage, setSelectedPage] = useState<PageDetails | null>(null);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);

  useEffect(() => {
    fetchData();
  }, [contractorId]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [contractorResponse, pagesResponse] = await Promise.all([
        api.get(API_ENDPOINTS.CONTRACTORS.GET(Number(contractorId))),
        api.get(API_ENDPOINTS.CONTRACTORS.PAGES(Number(contractorId))),
      ]);

      console.log('Contractor data:', contractorResponse.data);
      console.log('Pages data:', pagesResponse.data);
      setContractor(contractorResponse.data);
      setPages(pagesResponse.data);
    } catch (err: any) {
      console.error('Error fetching data:', err);
      setError(err.response?.data?.detail || 'Ошибка загрузки данных');
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetails = async (pageId: number) => {
    try {
      const response = await api.get(
        API_ENDPOINTS.CONTRACTORS.PAGE_DETAILS(Number(contractorId), pageId)
      );
      setSelectedPage(response.data);
      setDetailsDialogOpen(true);
    } catch (err: any) {
      console.error('Ошибка загрузки деталей страницы:', err);
    }
  };

  const handleOpenPage = (url: string) => {
    window.open(url, '_blank');
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircleIcon color="success" />;
      case 'failed':
        return <ErrorIcon color="error" />;
      case 'scanning':
        return <InfoIcon color="info" />;
      default:
        return <InfoIcon color="action" />;
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
        <Typography variant="h6">Загрузка...</Typography>
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
      {contractor && (
        <Paper sx={{ p: 3, mb: 3 }}>
          <Typography variant="h4" gutterBottom>
            {contractor.name}
          </Typography>
          <Typography variant="subtitle1" color="text.secondary" gutterBottom>
            {contractor.domain}
          </Typography>
          
          <Grid container spacing={2} sx={{ mt: 2 }}>
            <Grid item xs={12} sm={3}>
              <Card>
                <CardContent>
                  <Typography variant="h6">{contractor.total_pages}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    Всего страниц
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={3}>
              <Card>
                <CardContent>
                  <Typography variant="h6">{contractor.scanned_pages}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    Отсканировано
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={3}>
              <Card>
                <CardContent>
                  <Typography variant="h6" color="error">
                    {contractor.violations_found}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Нарушений
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={3}>
              <Card>
                <CardContent>
                  <Typography variant="h6">
                    {contractor.last_check ? new Date(contractor.last_check).toLocaleDateString() : 'Не сканировался'}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Последняя проверка
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </Paper>
      )}

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
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      {getStatusIcon(page.status)}
                      <Chip
                        label={page.status}
                        size="small"
                        color={page.status === 'completed' ? 'success' : 'default'}
                      />
                    </Box>
                  </TableCell>
                  <TableCell>
                    {page.http_status ? (
                      <Chip
                        label={page.http_status}
                        size="small"
                        color={page.http_status === 200 ? 'success' : 'error'}
                      />
                    ) : (
                      '-'
                    )}
                  </TableCell>
                  <TableCell>
                    {page.response_time ? `${page.response_time.toFixed(2)}s` : '-'}
                  </TableCell>
                  <TableCell>
                    {page.violations_found ? (
                      <Chip
                        icon={<WarningIcon />}
                        label={page.violations_count}
                        color="error"
                        size="small"
                      />
                    ) : (
                      <Chip label="Нет" color="success" size="small" />
                    )}
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
      </Paper>

      {/* Диалог с деталями нарушений */}
      <Dialog
        open={detailsDialogOpen}
        onClose={() => setDetailsDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          Детали нарушений - {selectedPage?.title || selectedPage?.url}
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
                    Статус:
                  </Typography>
                  <Typography variant="body1">{selectedPage.status}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">
                    HTTP статус:
                  </Typography>
                  <Typography variant="body1">
                    {selectedPage.http_status || '-'}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">
                    Время ответа:
                  </Typography>
                  <Typography variant="body1">
                    {selectedPage.response_time ? `${selectedPage.response_time.toFixed(2)}s` : '-'}
                  </Typography>
                </Grid>
              </Grid>

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