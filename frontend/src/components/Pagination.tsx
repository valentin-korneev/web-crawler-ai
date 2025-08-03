import React from 'react';
import {
  TablePagination,
  IconButton,
  Box,
  Typography,
} from '@mui/material';
import {
  FirstPage as FirstPageIcon,
  KeyboardArrowLeft as KeyboardArrowLeftIcon,
  KeyboardArrowRight as KeyboardArrowRightIcon,
  LastPage as LastPageIcon,
} from '@mui/icons-material';

interface PaginationProps {
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
  onPageChange: (page: number) => void;
  onPageSizeChange: (pageSize: number) => void;
}

const Pagination: React.FC<PaginationProps> = ({
  page,
  pageSize,
  totalItems,
  totalPages,
  hasNext,
  hasPrev,
  onPageChange,
  onPageSizeChange,
}) => {
  const handleFirstPage = () => {
    onPageChange(1);
  };

  const handlePreviousPage = () => {
    if (hasPrev) {
      onPageChange(page - 1);
    }
  };

  const handleNextPage = () => {
    if (hasNext) {
      onPageChange(page + 1);
    }
  };

  const handleLastPage = () => {
    onPageChange(totalPages);
  };

  return (
    <Box display="flex" alignItems="center" justifyContent="space-between" p={2}>
      <Box display="flex" alignItems="center">
        <Typography variant="body2" color="text.secondary">
          Показано {((page - 1) * pageSize) + 1}-{Math.min(page * pageSize, totalItems)} из {totalItems} записей
        </Typography>
      </Box>
      
      <Box display="flex" alignItems="center">
        <IconButton
          onClick={handleFirstPage}
          disabled={!hasPrev}
          aria-label="первая страница"
        >
          <FirstPageIcon />
        </IconButton>
        
        <IconButton
          onClick={handlePreviousPage}
          disabled={!hasPrev}
          aria-label="предыдущая страница"
        >
          <KeyboardArrowLeftIcon />
        </IconButton>
        
        <Typography variant="body2" sx={{ mx: 2 }}>
          Страница {page} из {totalPages}
        </Typography>
        
        <IconButton
          onClick={handleNextPage}
          disabled={!hasNext}
          aria-label="следующая страница"
        >
          <KeyboardArrowRightIcon />
        </IconButton>
        
        <IconButton
          onClick={handleLastPage}
          disabled={!hasNext}
          aria-label="последняя страница"
        >
          <LastPageIcon />
        </IconButton>
      </Box>
      
      <Box display="flex" alignItems="center">
        <Typography variant="body2" sx={{ mr: 1 }}>
          Записей на странице:
        </Typography>
        <select
          value={pageSize}
          onChange={(e) => onPageSizeChange(Number(e.target.value))}
          style={{
            padding: '4px 8px',
            border: '1px solid #ccc',
            borderRadius: '4px',
            fontSize: '14px'
          }}
        >
          <option value={10}>10</option>
          <option value={20}>20</option>
          <option value={50}>50</option>
          <option value={100}>100</option>
        </select>
      </Box>
    </Box>
  );
};

export default Pagination; 