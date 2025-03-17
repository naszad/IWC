import React, { useState, useEffect, useCallback } from 'react';
import {
  Container,
  Grid,
  Paper,
  Typography,
  Box,
  Avatar,
  Button,
  TextField,
  Chip,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
} from '@mui/material';
import {
  Edit as EditIcon,
  School as SchoolIcon,
  EmojiEvents as EmojiEventsIcon,
  LocalHospital as LocalHospitalIcon,
  PhotoCamera as PhotoCameraIcon,
  Refresh as RefreshIcon,
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import { UserProfile, Achievement } from '../interfaces/User';
import { FileUpload } from '../components/FileUpload';

const Profile = () => {
  const { user, updateProfile } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [profileImageUrl, setProfileImageUrl] = useState<string | null>(null);
  
  const [profileData, setProfileData] = useState<Partial<UserProfile>>({
    firstName: '',
    lastName: '',
    bio: '',
    profileImage: '',
  });

  // Mock achievements data
  const achievements = [
    {
      id: 1,
      title: 'Conversation Master',
      description: 'Completed 10 conversation practice sessions',
      dateEarned: new Date('2023-12-15'),
      type: 'speaking_practice',
    },
    {
      id: 2,
      title: 'Vocabulary Builder',
      description: 'Learned 500 new words',
      dateEarned: new Date('2024-01-10'),
      type: 'vocabulary_mastery',
    },
    {
      id: 3,
      title: 'Grammar Expert',
      description: 'Mastered advanced grammar concepts',
      dateEarned: new Date('2024-02-05'),
      type: 'grammar_mastery',
    },
    {
      id: 4,
      title: 'Community Contributor',
      description: 'Shared valuable insights in health forums',
      dateEarned: new Date('2024-03-01'),
      type: 'speaking_practice', // Changed from 'participation' to an allowed type
    },
  ];

  // Initialize profile data and image when component mounts or user changes
  const initializeUserData = useCallback(() => {
    if (user) {
      console.log('Initializing user data in Profile component:', user);
      
      // Update profile data state
      setProfileData({
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        bio: user.bio || '',
        profileImage: user.profileImage || '',
      });
      
      // Update profile image URL
      if (user.profileImage) {
        console.log('Setting initial profile image URL:', user.profileImage);
        setProfileImageUrl(user.profileImage);
      } else {
        console.log('No profile image available for user');
        setProfileImageUrl(null);
      }
    }
  }, [user]);

  // Initial setup when component mounts
  useEffect(() => {
    initializeUserData();
  }, [initializeUserData]);
  
  // Force image refresh when profileImageUrl changes
  useEffect(() => {
    if (profileImageUrl) {
      // Create a timestamp to force image refresh and avoid caching issues
      const timestamp = new Date().getTime();
      const imageWithTimestamp = profileImageUrl.includes('?') 
        ? `${profileImageUrl}&t=${timestamp}` 
        : `${profileImageUrl}?t=${timestamp}`;
      
      console.log('Refreshing image with timestamp:', imageWithTimestamp);
      
      // Preload the image to ensure it's in the browser cache
      const img = new Image();
      img.onload = () => console.log('Profile image preloaded successfully');
      img.onerror = (e) => console.error('Failed to preload profile image:', e);
      img.src = imageWithTimestamp;
    }
  }, [profileImageUrl]);

  const handleSave = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      await updateProfile(profileData);
      setIsEditing(false);
    } catch (err) {
      console.error('Profile update error:', err);
      setError(err instanceof Error ? err.message : 'Failed to update profile');
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (field: string) => (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    setProfileData((prev) => ({
      ...prev,
      [field]: event.target.value,
    }));
  };

  const handleProfileImageUploadSuccess = (data: any) => {
    // Get the URL from the response - check both standard formats
    console.log('Profile image upload response:', data);
    
    const imageUrl = data.file?.url || data.url || '';
    
    if (!imageUrl) {
      console.error('No image URL found in server response:', data);
      setError('Failed to get uploaded image URL. Please try again.');
      return;
    }
    
    console.log('Successfully uploaded profile image:', imageUrl);
    
    // Update state with the new image URL
    setProfileImageUrl(imageUrl);
    setProfileData((prev) => ({
      ...prev,
      profileImage: imageUrl,
    }));
    setUploadDialogOpen(false);
    
    // Update the profile with the new image URL
    const updatedProfile = { ...profileData, profileImage: imageUrl };
    console.log('Updating profile with:', updatedProfile);
    
    updateProfile(updatedProfile)
      .then((resp) => {
        // Show success feedback to user
        console.log('Profile updated with new image, response:', resp);
        
        // The image is already set in the state, and the AuthContext updates the user state,
        // so we don't need to do anything else here
      })
      .catch((err) => {
        console.error('Failed to update profile with new image:', err);
        setError('Image uploaded but failed to update profile. Please try again.');
      });
  };

  const handleProfileImageUploadError = (error: Error) => {
    console.error('Profile image upload error:', error);
    setError('Failed to upload profile image. Please try again.');
  };

  // Add a function to refresh the profile image
  const refreshProfileImage = () => {
    if (user?.profileImage) {
      console.log('Manually refreshing profile image');
      
      // Force a re-fetch by setting to null briefly
      setProfileImageUrl(null);
      
      // Then set back with a small delay
      setTimeout(() => {
        setProfileImageUrl(user.profileImage || null);
      }, 100);
    }
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      {/* For debugging - remove in production */}
      <Box sx={{ mb: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Typography variant="caption" color="text.secondary">
          Current profile image URL: {profileImageUrl || 'None'}
        </Typography>
        <IconButton 
          size="small" 
          color="primary" 
          onClick={refreshProfileImage}
          title="Refresh profile image"
        >
          <RefreshIcon fontSize="small" />
        </IconButton>
      </Box>
      
      <Grid container spacing={3}>
        {/* Profile Overview */}
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 3 }}>
            {error && (
              <Box sx={{ mb: 2, p: 2, bgcolor: 'error.light', borderRadius: 1 }}>
                <Typography color="error">{error}</Typography>
              </Box>
            )}
            
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                mb: 3,
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Box sx={{ position: 'relative' }}>
                  <Avatar
                    sx={{
                      width: 100,
                      height: 100,
                      mr: 3,
                      bgcolor: 'primary.main',
                      border: profileImageUrl ? '2px solid' : 'none',
                      borderColor: 'primary.light',
                    }}
                    src={profileImageUrl ? `${profileImageUrl}?t=${new Date().getTime()}` : undefined}
                    alt={`${user?.firstName || ''} ${user?.lastName || ''}`}
                    imgProps={{
                      onError: (e) => {
                        console.error('Error loading profile image:', profileImageUrl);
                        const target = e.target as HTMLImageElement;
                        console.log('Image element:', target);
                        // Reset the image if it fails to load
                        setProfileImageUrl(null);
                      }
                    }}
                  >
                    {(user?.firstName?.[0] || user?.username?.[0] || '?').toUpperCase()}
                  </Avatar>
                  <Box
                    sx={{
                      position: 'absolute',
                      bottom: 0,
                      right: 12,
                      bgcolor: 'background.paper',
                      borderRadius: '50%',
                      p: 0.5,
                      cursor: 'pointer',
                      '&:hover': {
                        bgcolor: 'action.hover',
                      },
                    }}
                    onClick={() => setUploadDialogOpen(true)}
                  >
                    <PhotoCameraIcon fontSize="small" color="primary" />
                  </Box>
                </Box>
                <Box>
                  <Typography variant="h4">
                    {user?.firstName} {user?.lastName}
                  </Typography>
                  <Typography variant="subtitle1" color="text.secondary">
                    {user?.role ? user.role.charAt(0).toUpperCase() + user.role.slice(1) : 'Guest'}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Member since {user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}
                  </Typography>
                </Box>
              </Box>
              <Button
                startIcon={<EditIcon />}
                onClick={() => setIsEditing(!isEditing)}
                disabled={isLoading}
              >
                {isEditing ? 'Cancel' : 'Edit Profile'}
              </Button>
            </Box>

            {isEditing ? (
              <Box component="form" sx={{ mt: 2 }}>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="First Name"
                      value={profileData.firstName}
                      onChange={handleChange('firstName')}
                      disabled={isLoading}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Last Name"
                      value={profileData.lastName}
                      onChange={handleChange('lastName')}
                      disabled={isLoading}
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Bio"
                      multiline
                      rows={4}
                      value={profileData.bio}
                      onChange={handleChange('bio')}
                      disabled={isLoading}
                    />
                  </Grid>
                </Grid>
                <Button
                  variant="contained"
                  onClick={handleSave}
                  sx={{ mt: 3 }}
                  disabled={isLoading}
                >
                  {isLoading ? 'Saving...' : 'Save Changes'}
                </Button>
              </Box>
            ) : (
              <Box>
                <Typography variant="body1" paragraph>
                  {profileData.bio || 'No bio provided yet.'}
                </Typography>
              </Box>
            )}
          </Paper>
        </Grid>

        {/* Achievements and Stats */}
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3, mb: 3 }}>
            <Typography variant="h6" gutterBottom>
              Learning Statistics
            </Typography>
            <List>
              <ListItem>
                <ListItemIcon>
                  <SchoolIcon color="primary" />
                </ListItemIcon>
                <ListItemText
                  primary="Assessments Completed"
                  secondary="5 assessments"
                />
              </ListItem>
              <ListItem>
                <ListItemIcon>
                  <LocalHospitalIcon color="primary" />
                </ListItemIcon>
                <ListItemText
                  primary="Health Modules Completed"
                  secondary="3 modules"
                />
              </ListItem>
            </List>
          </Paper>

          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Achievements
            </Typography>
            <List>
              {achievements.map((achievement) => (
                <ListItem key={achievement.id}>
                  <ListItemIcon>
                    <EmojiEventsIcon color="primary" />
                  </ListItemIcon>
                  <ListItemText
                    primary={achievement.title}
                    secondary={
                      <>
                        {achievement.description}
                        <br />
                        <Typography variant="caption" color="text.secondary">
                          Earned on{' '}
                          {achievement.dateEarned.toLocaleDateString()}
                        </Typography>
                      </>
                    }
                  />
                </ListItem>
              ))}
            </List>
          </Paper>
        </Grid>
      </Grid>

      {/* Profile Image Upload Dialog */}
      <Dialog
        open={uploadDialogOpen}
        onClose={() => setUploadDialogOpen(false)}
        aria-labelledby="profile-image-upload-dialog"
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle id="profile-image-upload-dialog">Upload Profile Picture</DialogTitle>
        <DialogContent>
          <Box sx={{ mb: 2 }}>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              Upload a profile picture to personalize your account. Images should be square for best results.
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Supported formats: JPEG, PNG, GIF. Maximum size: 2MB.
            </Typography>
          </Box>
          <FileUpload
            multiple={false}
            maxSize={2}
            acceptedFileTypes={['image/jpeg', 'image/png', 'image/gif']}
            onSuccess={handleProfileImageUploadSuccess}
            onError={handleProfileImageUploadError}
            buttonText="Select Image"
            dragText="or drag and drop your profile image here"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setUploadDialogOpen(false)}>
            Cancel
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default Profile; 