import React, { useState, useRef, ChangeEvent } from 'react';
import api from '../../utils/api';
import { Box, Button, Typography, Paper, List, ListItem, ListItemText, LinearProgress, styled } from '@mui/material';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import CloseIcon from '@mui/icons-material/Close';
import { useTheme } from '@mui/material/styles';

// Styled components
const FileUploadContainer = styled(Box)(({ theme }) => ({
  width: '100%',
  maxWidth: 600,
  margin: '0 auto',
  padding: theme.spacing(3),
  fontFamily: theme.typography.fontFamily,
}));

const DropZone = styled(Paper)(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  padding: theme.spacing(4),
  border: `2px dashed ${theme.palette.mode === 'dark' ? theme.palette.grey[700] : theme.palette.grey[300]}`,
  borderRadius: theme.shape.borderRadius,
  backgroundColor: theme.palette.mode === 'dark' ? theme.palette.background.paper : theme.palette.grey[50],
  cursor: 'pointer',
  transition: 'all 0.3s ease',
  '&.dragging': {
    borderColor: theme.palette.primary.main,
    backgroundColor: `${theme.palette.primary.main}10`,
  },
}));

const FileInput = styled('input')({
  display: 'none',
});

const SelectFilesButton = styled(Button)(({ theme }) => ({
  marginBottom: theme.spacing(1.5),
}));

const DragText = styled(Typography)(({ theme }) => ({
  color: theme.palette.text.secondary,
  fontSize: '0.9rem',
  margin: 0,
}));

const FileListContainer = styled(Box)(({ theme }) => ({
  marginTop: theme.spacing(3),
}));

const FileItem = styled(ListItem)(({ theme }) => ({
  padding: theme.spacing(1.5),
  marginBottom: theme.spacing(1),
  backgroundColor: theme.palette.mode === 'dark' ? theme.palette.background.paper : theme.palette.grey[50],
  borderRadius: theme.shape.borderRadius,
  border: `1px solid ${theme.palette.mode === 'dark' ? theme.palette.grey[800] : theme.palette.grey[200]}`,
}));

const FileName = styled(ListItemText)(({ theme }) => ({
  '& .MuiListItemText-primary': {
    fontWeight: 500,
    marginRight: theme.spacing(1),
    wordBreak: 'break-all',
  },
  '& .MuiListItemText-secondary': {
    color: theme.palette.text.secondary,
    fontSize: '0.85rem',
  }
}));

const RemoveButton = styled(Button)(({ theme }) => ({
  minWidth: 'auto',
  padding: theme.spacing(0.5, 1),
  color: theme.palette.error.main,
  '&:hover': {
    backgroundColor: `${theme.palette.error.main}10`,
  },
}));

const ErrorMessages = styled(Box)(({ theme }) => ({
  marginTop: theme.spacing(2),
  color: theme.palette.error.main,
  backgroundColor: `${theme.palette.error.main}10`,
  borderRadius: theme.shape.borderRadius,
  padding: theme.spacing(1.5),
}));

const UploadActions = styled(Box)(({ theme }) => ({
  marginTop: theme.spacing(3),
}));

const ProgressContainer = styled(Box)(({ theme }) => ({
  marginTop: theme.spacing(2),
  width: '100%',
}));

interface FileUploadProps {
  /**
   * If true, allows multiple file selection
   */
  multiple?: boolean;
  /**
   * Maximum number of files that can be uploaded at once (only for multiple uploads)
   */
  maxFiles?: number;
  /**
   * Maximum file size in MB
   */
  maxSize?: number;
  /**
   * Allowed file types (e.g., ['image/jpeg', 'image/png', 'application/pdf'])
   */
  acceptedFileTypes?: string[];
  /**
   * File accept attribute (e.g., "image/*", ".pdf,.doc")
   */
  accept?: string;
  /**
   * Callback function when upload is successful
   */
  onSuccess?: (data: any) => void;
  /**
   * Callback function when upload fails
   */
  onError?: (error: Error) => void;
  /**
   * Custom class name for the upload container
   */
  className?: string;
  /**
   * Custom button text
   */
  buttonText?: string;
  /**
   * Custom drag text
   */
  dragText?: string;
  /**
   * Label for the upload component
   */
  label?: string;
}

export const FileUpload: React.FC<FileUploadProps> = ({
  multiple = false,
  maxFiles = 5,
  maxSize = 5,
  acceptedFileTypes = ['image/jpeg', 'image/png', 'application/pdf'],
  onSuccess,
  onError,
  className = '',
  buttonText = 'Select Files',
  dragText = 'or drag and drop files here',
  label = '',
}) => {
  const [files, setFiles] = useState<File[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [errors, setErrors] = useState<string[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const theme = useTheme();

  // Convert maxSize from MB to bytes
  const maxSizeBytes = maxSize * 1024 * 1024;

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.length) return;
    
    const selectedFiles = Array.from(e.target.files);
    validateAndSetFiles(selectedFiles);
  };

  const validateAndSetFiles = (selectedFiles: File[]) => {
    setErrors([]);
    const newErrors: string[] = [];
    
    // Check if too many files are selected
    if (multiple && selectedFiles.length > maxFiles) {
      newErrors.push(`You can only upload a maximum of ${maxFiles} files at once`);
    }

    // Validate each file
    const validFiles = selectedFiles.filter(file => {
      // Check file size
      if (file.size > maxSizeBytes) {
        newErrors.push(`${file.name} exceeds the maximum file size of ${maxSize}MB`);
        return false;
      }

      // Check file type
      if (acceptedFileTypes.length && !acceptedFileTypes.includes(file.type)) {
        newErrors.push(`${file.name} has an unsupported file type`);
        return false;
      }

      return true;
    });

    // If there are errors, show them
    if (newErrors.length) {
      setErrors(newErrors);
    }

    // Set valid files
    if (multiple) {
      setFiles(validFiles);
    } else {
      // For single file upload, just take the first valid file
      setFiles(validFiles.slice(0, 1));
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);

    if (!e.dataTransfer.files?.length) return;
    
    const droppedFiles = Array.from(e.dataTransfer.files);
    validateAndSetFiles(droppedFiles);
  };

  const handleUpload = async () => {
    if (!files.length) {
      setErrors(['Please select files to upload']);
      return;
    }

    try {
      setIsUploading(true);
      setUploadProgress(0);
      
      const formData = new FormData();
      
      if (multiple) {
        // For multiple files, append each file with the name 'files'
        files.forEach(file => {
          formData.append('files', file);
        });
        
        const response = await api.post('/upload/multiple', formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
          onUploadProgress: (progressEvent) => {
            const percentCompleted = Math.round((progressEvent.loaded * 100) / (progressEvent.total || 1));
            setUploadProgress(percentCompleted);
          },
        });
        
        if (onSuccess) onSuccess(response.data);
      } else {
        // For single file upload
        formData.append('file', files[0]);
        
        const response = await api.post('/upload/single', formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
          onUploadProgress: (progressEvent) => {
            const percentCompleted = Math.round((progressEvent.loaded * 100) / (progressEvent.total || 1));
            setUploadProgress(percentCompleted);
          },
        });
        
        if (onSuccess) onSuccess(response.data);
      }
      
      // Reset after successful upload
      setFiles([]);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (error) {
      console.error('Upload error:', error);
      setErrors(['Failed to upload files. Please try again.']);
      if (onError && error instanceof Error) onError(error);
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemoveFile = (index: number) => {
    setFiles(prevFiles => prevFiles.filter((_, i) => i !== index));
  };

  const handleButtonClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  return (
    <FileUploadContainer className={className}>
      <DropZone
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={isDragging ? 'dragging' : ''}
        elevation={0}
      >
        <FileInput
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          multiple={multiple}
          accept={acceptedFileTypes.join(',')}
        />
        <SelectFilesButton 
          variant="contained" 
          onClick={handleButtonClick}
          disabled={isUploading}
          startIcon={<CloudUploadIcon />}
        >
          {buttonText}
        </SelectFilesButton>
        <DragText variant="body2">{dragText}</DragText>
      </DropZone>

      {/* File List */}
      {files.length > 0 && (
        <FileListContainer>
          <Typography variant="h6" gutterBottom>
            Selected Files:
          </Typography>
          <List>
            {files.map((file, index) => (
              <FileItem key={index} disablePadding>
                <FileName 
                  primary={file.name}
                  secondary={`${(file.size / 1024 / 1024).toFixed(2)} MB`}
                />
                <RemoveButton 
                  onClick={() => handleRemoveFile(index)}
                  disabled={isUploading}
                  startIcon={<CloseIcon />}
                >
                  Remove
                </RemoveButton>
              </FileItem>
            ))}
          </List>
        </FileListContainer>
      )}

      {/* Error Messages */}
      {errors.length > 0 && (
        <ErrorMessages>
          {errors.map((error, index) => (
            <Typography key={index} variant="body2" component="p">
              {error}
            </Typography>
          ))}
        </ErrorMessages>
      )}

      {/* Upload Button and Progress */}
      {files.length > 0 && (
        <UploadActions>
          <Button 
            variant="contained" 
            color="success"
            onClick={handleUpload}
            disabled={isUploading || !files.length}
            fullWidth
          >
            {isUploading ? 'Uploading...' : 'Upload'}
          </Button>
          
          {isUploading && (
            <ProgressContainer>
              <LinearProgress 
                variant="determinate" 
                value={uploadProgress} 
                color="primary"
              />
              <Box sx={{ display: 'flex', justifyContent: 'center', mt: 1 }}>
                <Typography variant="body2" color="text.secondary">
                  {uploadProgress}%
                </Typography>
              </Box>
            </ProgressContainer>
          )}
        </UploadActions>
      )}
    </FileUploadContainer>
  );
};

export default FileUpload; 