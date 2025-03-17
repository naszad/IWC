import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Container, 
  Typography, 
  TextField, 
  Button, 
  Box, 
  FormControl, 
  InputLabel, 
  Select, 
  MenuItem, 
  Chip,
  Paper,
  OutlinedInput,
  Alert,
  Divider,
  Tab,
  Tabs,
  IconButton,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Grid,
  Card,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  RadioGroup,
  Radio,
  FormControlLabel,
  Tooltip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import { useAuth } from '../contexts/AuthContext';
import { FileUpload } from '../components/FileUpload';
import { createAssessment } from '../utils/assessmentService';
import { v4 as uuidv4 } from 'uuid';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

// Interface for question types (renamed from Question for clarity)
interface Question {
  id: string;
  type: 'multiple-choice' | 'fill-in-blank' | 'matching' | 'flashcards';
  title: string;
  instructions: string;
  questions?: {
    id: string;
    text: string;
    options?: string[];
    correctAnswer?: string;
  }[];
  words?: {
    id: string;
    term: string;
    translation: string;
    example?: string;
  }[];
  sentences?: {
    id: string;
    text: string;
    answer: string;
  }[];
  matchItems?: {
    id: string;
    term: string;
    translation: string;
  }[];
}

interface Assessment {
  title: string;
  description: string;
  language: string;
  level: 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2';
  category: 'vocabulary' | 'grammar' | 'reading' | 'listening' | 'speaking' | 'writing';
  duration: number;
  questions: Question[]; // Renamed from questions to questions
  tags: string[];
  imageUrl?: string;
  materials?: { name: string; url: string; size: number }[];
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`assessment-tabpanel-${index}`}
      aria-labelledby={`assessment-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

const CreateAssessment = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState(0);

  // Basic info state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<'vocabulary' | 'grammar' | 'reading' | 'listening' | 'speaking' | 'writing'>('vocabulary');
  const [level, setLevel] = useState<'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2'>('A1');
  const [language, setLanguage] = useState('English');
  const [duration, setDuration] = useState(30);
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');

  // Questions state (renamed from questions for clarity)
  const [questions, setQuestions] = useState<Question[]>([]);
  const [assessmentImage, setAssessmentImage] = useState<string | null>(null);
  const [assessmentMaterials, setAssessmentMaterials] = useState<{ name: string; url: string; size: number }[]>([]);

  // New question form state
  const [showQuestionForm, setShowQuestionForm] = useState(false);
  const [newQuestionType, setNewQuestionType] = useState<'multiple-choice' | 'fill-in-blank' | 'matching' | 'flashcards'>('multiple-choice');
  const [newQuestionTitle, setNewQuestionTitle] = useState('');
  const [newQuestionInstructions, setNewQuestionInstructions] = useState('');

  // Add new state variables for question editing
  const [editingQuestionId, setEditingQuestionId] = useState<string | null>(null);
  
  // Multiple choice editing state
  const [mcQuestionText, setMcQuestionText] = useState('');
  const [mcOptions, setMcOptions] = useState<string[]>(['', '', '', '']);
  const [mcCorrectAnswer, setMcCorrectAnswer] = useState('');
  const [newMcOption, setNewMcOption] = useState('');
  
  // Fill in blank editing state
  const [fibSentence, setFibSentence] = useState('');
  const [fibAnswer, setFibAnswer] = useState('');
  const [fibSentences, setFibSentences] = useState<{id: string, text: string, answer: string}[]>([]);
  
  // Matching editing state
  const [matchTerms, setMatchTerms] = useState<{id: string, term: string, translation: string}[]>([
    {id: uuidv4(), term: '', translation: ''}
  ]);
  
  // Flashcard editing state
  const [flashcardWords, setFlashcardWords] = useState<{id: string, term: string, translation: string, example?: string}[]>([
    {id: uuidv4(), term: '', translation: '', example: ''}
  ]);

  const handleAddTag = () => {
    if (tagInput.trim() && !tags.includes(tagInput.trim())) {
      setTags([...tags, tagInput.trim()]);
      setTagInput('');
    }
  };

  const handleDeleteTag = (tagToDelete: string) => {
    setTags(tags.filter(tag => tag !== tagToDelete));
  };

  const handleTagInputKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddTag();
    }
  };

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  const handleImageUploadSuccess = (data: any) => {
    const imageUrl = data.fileUrl || data.url;
    setAssessmentImage(imageUrl);
  };

  const handleMaterialsUploadSuccess = (data: any) => {
    const files = Array.isArray(data) ? data : [data];
    const newMaterials = files.map(file => ({
      name: file.originalName || file.name,
      url: file.fileUrl || file.url,
      size: file.size || 0
    }));
    
    setAssessmentMaterials([...assessmentMaterials, ...newMaterials]);
  };

  const handleUploadError = (error: Error) => {
    console.error('Upload error:', error);
    setError('Failed to upload file. Please try again.');
  };

  const handleRemoveMaterial = (index: number) => {
    setAssessmentMaterials(materials => materials.filter((_, i) => i !== index));
  };

  const toggleQuestionForm = () => {
    setShowQuestionForm(!showQuestionForm);
    resetNewQuestionForm();
  };

  const resetQuestionFormState = () => {
    // Reset all question type specific state
    setMcQuestionText('');
    setMcOptions(['', '', '', '']);
    setMcCorrectAnswer('');
    setFibSentence('');
    setFibAnswer('');
    setFibSentences([{id: uuidv4(), text: '', answer: ''}]);
    setMatchTerms([{id: uuidv4(), term: '', translation: ''}]);
    setFlashcardWords([{id: uuidv4(), term: '', translation: '', example: ''}]);
  };

  const resetNewQuestionForm = () => {
    setNewQuestionType('multiple-choice');
    setNewQuestionTitle('');
    setNewQuestionInstructions('');
    setEditingQuestionId(null);
    resetQuestionFormState();
  };

  const handleEditQuestion = (questionId: string) => {
    const questionToEdit = questions.find(q => q.id === questionId);
    if (!questionToEdit) return;
    
    setEditingQuestionId(questionId);
    setNewQuestionType(questionToEdit.type);
    setNewQuestionTitle(questionToEdit.title);
    setNewQuestionInstructions(questionToEdit.instructions);
    
    // Set up editing state based on question type
    switch (questionToEdit.type) {
      case 'multiple-choice':
        if (questionToEdit.questions && questionToEdit.questions.length > 0) {
          setMcQuestionText(questionToEdit.questions[0].text || '');
          setMcOptions(questionToEdit.questions[0].options || ['', '', '']);
          setMcCorrectAnswer(questionToEdit.questions[0].correctAnswer || '');
        }
        break;
      
      case 'fill-in-blank':
        if (questionToEdit.sentences && questionToEdit.sentences.length > 0) {
          setFibSentences(questionToEdit.sentences);
        } else {
          setFibSentences([{id: uuidv4(), text: '', answer: ''}]);
        }
        break;
      
      case 'matching':
        if (questionToEdit.matchItems && questionToEdit.matchItems.length > 0) {
          setMatchTerms(questionToEdit.matchItems);
        } else {
          setMatchTerms([{id: uuidv4(), term: '', translation: ''}]);
        }
        break;
      
      case 'flashcards':
        if (questionToEdit.words && questionToEdit.words.length > 0) {
          // Explicitly map each word to match our state type
          const mappedWords = questionToEdit.words.map(word => ({
            id: word.id,
            term: word.term,
            translation: word.translation,
            example: word.example || '' // Provide default value
          }));
          setFlashcardWords(mappedWords);
        } else {
          setFlashcardWords([{id: uuidv4(), term: '', translation: '', example: ''}]);
        }
        break;
    }
    
    setShowQuestionForm(true);
  };

  const handleAddOrUpdateQuestion = () => {
    if (!newQuestionTitle.trim()) {
      setError('Question title is required');
      return;
    }

    if (!newQuestionInstructions.trim()) {
      setError('Question instructions are required');
      return;
    }

    // Validate based on question type
    let isValid = true;
    let errorMessage = '';

    switch (newQuestionType) {
      case 'multiple-choice':
        if (!mcQuestionText.trim()) {
          isValid = false;
          errorMessage = 'Question text is required';
        } else if (mcOptions.some(opt => !opt.trim())) {
          isValid = false;
          errorMessage = 'All options must have content';
        } else if (!mcCorrectAnswer) {
          isValid = false;
          errorMessage = 'You must select a correct answer';
        }
        break;
      
      case 'fill-in-blank':
        if (fibSentences.length === 0) {
          isValid = false;
          errorMessage = 'At least one sentence is required';
        } else if (fibSentences.some(s => !s.text.trim() || !s.answer.trim())) {
          isValid = false;
          errorMessage = 'All sentences and answers must have content';
        }
        break;
      
      case 'matching':
        if (matchTerms.length < 2) {
          isValid = false;
          errorMessage = 'At least two matching items are required';
        } else if (matchTerms.some(item => !item.term.trim() || !item.translation.trim())) {
          isValid = false;
          errorMessage = 'All terms and translations must have content';
        }
        break;
      
      case 'flashcards':
        if (flashcardWords.length === 0) {
          isValid = false;
          errorMessage = 'At least one flashcard is required';
        } else if (flashcardWords.some(word => !word.term.trim() || !word.translation.trim())) {
          isValid = false;
          errorMessage = 'All terms and translations must have content';
        }
        break;
    }

    if (!isValid) {
      setError(errorMessage);
      return;
    }

    let newQuestion: Question = {
      id: editingQuestionId || uuidv4(),
      type: newQuestionType,
      title: newQuestionTitle,
      instructions: newQuestionInstructions,
    };

    // Set question type-specific data
    switch (newQuestionType) {
      case 'multiple-choice':
        // Add debug logs to help with troubleshooting
        console.log('Creating multiple choice question:');
        console.log('Options:', mcOptions);
        console.log('Selected correct answer:', mcCorrectAnswer);
        
        // Store the original options and correct answer
        const filteredOptions = mcOptions.filter(opt => opt.trim());
        newQuestion.questions = [{
          id: uuidv4(),
          text: mcQuestionText,
          options: filteredOptions,
          correctAnswer: mcCorrectAnswer
        }];
        
        // Log the final question
        console.log('Final MC question:', newQuestion.questions[0]);
        break;
      
      case 'fill-in-blank':
        newQuestion.sentences = fibSentences;
        break;
      
      case 'matching':
        newQuestion.matchItems = matchTerms;
        break;
      
      case 'flashcards':
        newQuestion.words = flashcardWords;
        break;
    }

    if (editingQuestionId) {
      // Update existing question
      setQuestions(questions.map(q => q.id === editingQuestionId ? newQuestion : q));
    } else {
      // Add new question
      setQuestions([...questions, newQuestion]);
    }

    setShowQuestionForm(false);
    resetNewQuestionForm();
    setError(null);
  };

  // Add a multiple choice option
  const handleAddMcOption = () => {
    if (newMcOption.trim()) {
      setMcOptions([...mcOptions, newMcOption.trim()]);
      setNewMcOption('');
    }
  };

  // Remove a multiple choice option
  const handleRemoveMcOption = (index: number) => {
    const newOptions = [...mcOptions];
    newOptions.splice(index, 1);
    setMcOptions(newOptions);
    
    // If removed option was the correct answer, reset correct answer
    if (mcOptions[index] === mcCorrectAnswer) {
      setMcCorrectAnswer('');
    }
  };

  // Add a fill-in-blank sentence
  const handleAddFibSentence = () => {
    if (fibSentence.trim() && fibAnswer.trim()) {
      setFibSentences([...fibSentences, {
        id: uuidv4(),
        text: fibSentence,
        answer: fibAnswer
      }]);
      setFibSentence('');
      setFibAnswer('');
    }
  };

  // Remove a fill-in-blank sentence
  const handleRemoveFibSentence = (id: string) => {
    setFibSentences(fibSentences.filter(s => s.id !== id));
  };

  // Update an existing fill-in-blank sentence
  const handleUpdateFibSentence = (id: string, field: 'text' | 'answer', value: string) => {
    setFibSentences(fibSentences.map(s => 
      s.id === id ? { ...s, [field]: value } : s
    ));
  };

  // Add a matching term
  const handleAddMatchTerm = () => {
    setMatchTerms([...matchTerms, {
      id: uuidv4(),
      term: '',
      translation: ''
    }]);
  };

  // Remove a matching term
  const handleRemoveMatchTerm = (id: string) => {
    setMatchTerms(matchTerms.filter(item => item.id !== id));
  };

  // Update a matching term
  const handleUpdateMatchTerm = (id: string, field: 'term' | 'translation', value: string) => {
    setMatchTerms(matchTerms.map(item => 
      item.id === id ? { ...item, [field]: value } : item
    ));
  };

  // Add a flashcard
  const handleAddFlashcard = () => {
    setFlashcardWords([...flashcardWords, {
      id: uuidv4(),
      term: '',
      translation: '',
      example: ''
    }]);
  };

  // Remove a flashcard
  const handleRemoveFlashcard = (id: string) => {
    setFlashcardWords(flashcardWords.filter(word => word.id !== id));
  };

  // Update a flashcard
  const handleUpdateFlashcard = (id: string, field: 'term' | 'translation' | 'example', value: string) => {
    setFlashcardWords(flashcardWords.map(word => 
      word.id === id ? { ...word, [field]: value } : word
    ));
  };

  const handleRemoveQuestion = (questionId: string) => {
    setQuestions(questions.filter(q => q.id !== questionId));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!title.trim()) {
      setError('Assessment title is required');
      return;
    }
    
    if (!description.trim()) {
      setError('Assessment description is required');
      return;
    }

    if (questions.length === 0) {
      setError('At least one question is required');
      return;
    }
    
    // Check if user is authenticated
    if (!user) {
      setError('You must be logged in to create an assessment');
      return;
    }
    
    // Check if user has the required role
    if (user.role !== 'instructor' && user.role !== 'admin') {
      setError('You must be an instructor or admin to create assessments');
      return;
    }
    
    try {
      setIsSubmitting(true);
      setError(null);
      
      // Create a clean copy of the questions to ensure proper structure
      const formattedQuestions = questions.map(q => ({
        id: q.id,
        type: q.type,
        title: q.title,
        instructions: q.instructions,
        questions: q.questions,
        words: q.words,
        sentences: q.sentences,
        matchItems: q.matchItems
      }));
      
      const assessmentData: Assessment = {
        title,
        description,
        language,
        category,
        level,
        duration,
        questions: formattedQuestions,
        tags: tags.length > 0 ? tags : [],
        imageUrl: assessmentImage || undefined,
        materials: assessmentMaterials.length > 0 ? assessmentMaterials : undefined
      };
      
      console.log('Submitting assessment data:', assessmentData);
      
      // Call the createAssessment API
      await createAssessment(assessmentData);
      
      setIsSubmitting(false);
      navigate('/assessments'); // Navigate to assessments listing
      
    } catch (error: any) {
      console.error('Error creating assessment:', error);
      const errorMessage = error.response?.data?.error || 'Failed to create assessment. Please try again later.';
      setError(errorMessage);
      setIsSubmitting(false);
    }
  };

  return (
    <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
      <Paper sx={{ p: 3 }}>
        <Typography variant="h4" gutterBottom>
          Create New Assessment
        </Typography>
        
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}
        
        <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
          <Tabs 
            value={activeTab} 
            onChange={handleTabChange}
            aria-label="assessment creation tabs"
          >
            <Tab label="Basic Info" />
            <Tab label="Questions" />
            <Tab label="Media & Resources" />
          </Tabs>
        </Box>

        <TabPanel value={activeTab} index={0}>
          <Box component="form" sx={{ mt: 2 }}>
            <TextField
              label="Title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              fullWidth
              margin="normal"
              required
            />
            <TextField
              label="Description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              fullWidth
              margin="normal"
              required
              multiline
              rows={4}
            />
            <TextField
              label="Language"
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              fullWidth
              margin="normal"
              required
            />
            <FormControl fullWidth margin="normal">
              <InputLabel>Category</InputLabel>
              <Select
                value={category}
                onChange={(e) => setCategory(e.target.value as 'vocabulary' | 'grammar' | 'reading' | 'listening' | 'speaking' | 'writing')}
                label="Category"
              >
                <MenuItem value="vocabulary">Vocabulary</MenuItem>
                <MenuItem value="grammar">Grammar</MenuItem>
                <MenuItem value="reading">Reading</MenuItem>
                <MenuItem value="listening">Listening</MenuItem>
                <MenuItem value="speaking">Speaking</MenuItem>
                <MenuItem value="writing">Writing</MenuItem>
              </Select>
            </FormControl>
            <FormControl fullWidth margin="normal">
              <InputLabel>Level</InputLabel>
              <Select
                value={level}
                onChange={(e) => setLevel(e.target.value as 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2')}
                label="Level"
              >
                <MenuItem value="A1">A1</MenuItem>
                <MenuItem value="A2">A2</MenuItem>
                <MenuItem value="B1">B1</MenuItem>
                <MenuItem value="B2">B2</MenuItem>
                <MenuItem value="C1">C1</MenuItem>
                <MenuItem value="C2">C2</MenuItem>
              </Select>
            </FormControl>
            <TextField
              label="Duration (minutes)"
              type="number"
              value={duration}
              onChange={(e) => setDuration(Number(e.target.value))}
              fullWidth
              margin="normal"
              required
              inputProps={{ min: 1 }}
            />
            
            {/* Tags section */}
            <Box sx={{ mt: 3, mb: 2 }}>
              <Typography variant="subtitle1" gutterBottom>
                Tags
              </Typography>
              <Box sx={{ display: 'flex', mb: 2 }}>
                <TextField
                  label="Add a tag"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={handleTagInputKeyDown}
                  fullWidth
                  margin="normal"
                />
                <Button 
                  variant="contained" 
                  onClick={handleAddTag}
                  sx={{ ml: 1, mt: 2 }}
                >
                  Add
                </Button>
              </Box>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                {tags.map((tag) => (
                  <Chip
                    key={tag}
                    label={tag}
                    onDelete={() => handleDeleteTag(tag)}
                  />
                ))}
              </Box>
            </Box>
          </Box>
        </TabPanel>

        <TabPanel value={activeTab} index={1}>
          <Box sx={{ mt: 2 }}>
            <Typography variant="h6" gutterBottom>
              Assessment Questions
            </Typography>
            
            {questions.length > 0 ? (
              <List>
                {questions.map((question) => (
                  <ListItem
                    key={question.id}
                    component={Paper}
                    sx={{ mb: 2, p: 2 }}
                  >
                    <ListItemText
                      primary={question.title}
                      secondary={
                        <>
                          <Typography variant="body2" component="span">
                            Type: {question.type}
                          </Typography>
                          <br />
                          <Typography variant="body2" component="span">
                            {question.instructions}
                          </Typography>
                          <br />
                          <Typography variant="body2" component="span" sx={{ color: 'text.secondary' }}>
                            {question.type === 'multiple-choice' && question.questions && 
                              `${question.questions.length} question(s) with ${question.questions[0]?.options?.length || 0} options`}
                            {question.type === 'fill-in-blank' && question.sentences && 
                              `${question.sentences.length} sentence(s)`}
                            {question.type === 'matching' && question.matchItems && 
                              `${question.matchItems.length} matching pair(s)`}
                            {question.type === 'flashcards' && question.words && 
                              `${question.words.length} flashcard(s)`}
                          </Typography>
                        </>
                      }
                    />
                    <Box>
                      <IconButton 
                        edge="end" 
                        aria-label="edit"
                        onClick={() => handleEditQuestion(question.id)}
                        sx={{ mr: 1 }}
                      >
                        <EditIcon />
                      </IconButton>
                      <IconButton 
                        edge="end" 
                        aria-label="delete"
                        onClick={() => handleRemoveQuestion(question.id)}
                      >
                        <DeleteIcon />
                      </IconButton>
                    </Box>
                  </ListItem>
                ))}
              </List>
            ) : (
              <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
                No questions added yet. Add your first question below.
              </Typography>
            )}
            
            {!showQuestionForm ? (
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={toggleQuestionForm}
                sx={{ mt: 2 }}
              >
                Add Question
              </Button>
            ) : (
              <Card sx={{ mt: 3, p: 1 }}>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    {editingQuestionId ? 'Edit Question' : 'Add New Question'}
                  </Typography>
                  <FormControl fullWidth margin="normal">
                    <InputLabel>Question Type</InputLabel>
                    <Select
                      value={newQuestionType}
                      onChange={(e) => {
                        setNewQuestionType(e.target.value as 'multiple-choice' | 'fill-in-blank' | 'matching' | 'flashcards');
                        resetQuestionFormState();
                      }}
                      label="Question Type"
                    >
                      <MenuItem value="multiple-choice">Multiple Choice</MenuItem>
                      <MenuItem value="fill-in-blank">Fill in the Blanks</MenuItem>
                      <MenuItem value="matching">Matching</MenuItem>
                      <MenuItem value="flashcards">Flashcards</MenuItem>
                    </Select>
                  </FormControl>
                  <TextField
                    label="Question Title"
                    value={newQuestionTitle}
                    onChange={(e) => setNewQuestionTitle(e.target.value)}
                    fullWidth
                    margin="normal"
                    required
                  />
                  <TextField
                    label="Instructions"
                    value={newQuestionInstructions}
                    onChange={(e) => setNewQuestionInstructions(e.target.value)}
                    fullWidth
                    margin="normal"
                    required
                    multiline
                    rows={2}
                  />
                  
                  {/* Question Type-Specific Forms */}
                  {newQuestionType === 'multiple-choice' && (
                    <Box sx={{ mt: 3, border: '1px solid #e0e0e0', borderRadius: 1, p: 2 }}>
                      <Typography variant="subtitle1" gutterBottom>Multiple Choice Question</Typography>
                      <TextField
                        label="Question Text"
                        value={mcQuestionText}
                        onChange={(e) => setMcQuestionText(e.target.value)}
                        fullWidth
                        margin="normal"
                        required
                      />
                      
                      <Typography variant="subtitle2" sx={{ mt: 2, mb: 1 }}>Options:</Typography>
                      <FormControl component="fieldset" fullWidth>
                        <RadioGroup
                          value={mcCorrectAnswer}
                          onChange={(e) => setMcCorrectAnswer(e.target.value)}
                        >
                          {mcOptions.map((option, index) => (
                            <Box key={index} sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                              <FormControlLabel
                                value={option}
                                control={<Radio disabled={!option.trim()} />}
                                label=""
                                sx={{ mr: 0 }}
                              />
                              <TextField
                                value={option}
                                onChange={(e) => {
                                  const newOptions = [...mcOptions];
                                  newOptions[index] = e.target.value;
                                  setMcOptions(newOptions);
                                  
                                  // Update correct answer if it was this option
                                  if (mcCorrectAnswer === mcOptions[index]) {
                                    setMcCorrectAnswer(e.target.value);
                                  }
                                }}
                                fullWidth
                                placeholder={`Option ${index + 1}`}
                                size="small"
                              />
                              <IconButton 
                                size="small" 
                                onClick={() => handleRemoveMcOption(index)}
                                sx={{ ml: 1 }}
                              >
                                <DeleteIcon />
                              </IconButton>
                            </Box>
                          ))}
                        </RadioGroup>
                      </FormControl>
                      
                      <Box sx={{ display: 'flex', mt: 2 }}>
                        <TextField
                          label="New Option"
                          value={newMcOption}
                          onChange={(e) => setNewMcOption(e.target.value)}
                          size="small"
                          fullWidth
                        />
                        <Button 
                          variant="outlined" 
                          onClick={handleAddMcOption}
                          disabled={!newMcOption.trim()}
                          sx={{ ml: 1 }}
                        >
                          Add
                        </Button>
                      </Box>
                      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
                        Select a radio button to mark the correct answer.
                      </Typography>
                    </Box>
                  )}
                  
                  {newQuestionType === 'fill-in-blank' && (
                    <Box sx={{ mt: 3, border: '1px solid #e0e0e0', borderRadius: 1, p: 2 }}>
                      <Typography variant="subtitle1" gutterBottom>Fill in the Blanks Sentences</Typography>
                      
                      {fibSentences.length > 0 && (
                        <TableContainer component={Paper} variant="outlined" sx={{ mb: 3 }}>
                          <Table size="small">
                            <TableHead>
                              <TableRow>
                                <TableCell>Sentence (use [blank] to mark the blank space)</TableCell>
                                <TableCell>Answer</TableCell>
                                <TableCell width="10%">Actions</TableCell>
                              </TableRow>
                            </TableHead>
                            <TableBody>
                              {fibSentences.map((sentence) => (
                                <TableRow key={sentence.id}>
                                  <TableCell>
                                    <TextField
                                      value={sentence.text}
                                      onChange={(e) => handleUpdateFibSentence(sentence.id, 'text', e.target.value)}
                                      fullWidth
                                      size="small"
                                      placeholder="e.g., The capital of France is [blank]."
                                    />
                                  </TableCell>
                                  <TableCell>
                                    <TextField
                                      value={sentence.answer}
                                      onChange={(e) => handleUpdateFibSentence(sentence.id, 'answer', e.target.value)}
                                      fullWidth
                                      size="small"
                                      placeholder="e.g., Paris"
                                    />
                                  </TableCell>
                                  <TableCell>
                                    <IconButton 
                                      size="small" 
                                      onClick={() => handleRemoveFibSentence(sentence.id)}
                                      disabled={fibSentences.length <= 1}
                                    >
                                      <DeleteIcon />
                                    </IconButton>
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </TableContainer>
                      )}
                      
                      <Button
                        variant="outlined"
                        startIcon={<AddIcon />}
                        onClick={() => setFibSentences([...fibSentences, {id: uuidv4(), text: '', answer: ''}])}
                        sx={{ mt: 1 }}
                      >
                        Add Another Sentence
                      </Button>
                      
                      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
                        For each sentence, use [blank] to indicate where the student should fill in the answer.
                      </Typography>
                    </Box>
                  )}
                  
                  {newQuestionType === 'matching' && (
                    <Box sx={{ mt: 3, border: '1px solid #e0e0e0', borderRadius: 1, p: 2 }}>
                      <Typography variant="subtitle1" gutterBottom>Matching Items</Typography>
                      
                      <TableContainer component={Paper} variant="outlined" sx={{ mb: 3 }}>
                        <Table size="small">
                          <TableHead>
                            <TableRow>
                              <TableCell>Term</TableCell>
                              <TableCell>Translation/Match</TableCell>
                              <TableCell width="10%">Actions</TableCell>
                            </TableRow>
                          </TableHead>
                          <TableBody>
                            {matchTerms.map((item) => (
                              <TableRow key={item.id}>
                                <TableCell>
                                  <TextField
                                    value={item.term}
                                    onChange={(e) => handleUpdateMatchTerm(item.id, 'term', e.target.value)}
                                    fullWidth
                                    size="small"
                                    placeholder="e.g., Apple"
                                  />
                                </TableCell>
                                <TableCell>
                                  <TextField
                                    value={item.translation}
                                    onChange={(e) => handleUpdateMatchTerm(item.id, 'translation', e.target.value)}
                                    fullWidth
                                    size="small"
                                    placeholder="e.g., Manzana"
                                  />
                                </TableCell>
                                <TableCell>
                                  <IconButton 
                                    size="small" 
                                    onClick={() => handleRemoveMatchTerm(item.id)}
                                    disabled={matchTerms.length <= 1}
                                  >
                                    <DeleteIcon />
                                  </IconButton>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </TableContainer>
                      
                      <Button
                        variant="outlined"
                        startIcon={<AddIcon />}
                        onClick={handleAddMatchTerm}
                        sx={{ mt: 1 }}
                      >
                        Add Matching Pair
                      </Button>
                    </Box>
                  )}
                  
                  {newQuestionType === 'flashcards' && (
                    <Box sx={{ mt: 3, border: '1px solid #e0e0e0', borderRadius: 1, p: 2 }}>
                      <Typography variant="subtitle1" gutterBottom>Flashcards</Typography>
                      
                      {flashcardWords.map((word, index) => (
                        <Card key={word.id} variant="outlined" sx={{ mb: 2, p: 2 }}>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                            <Typography variant="subtitle2">Flashcard {index + 1}</Typography>
                            <IconButton 
                              size="small" 
                              onClick={() => handleRemoveFlashcard(word.id)}
                              disabled={flashcardWords.length <= 1}
                            >
                              <DeleteIcon />
                            </IconButton>
                          </Box>
                          <TextField
                            label="Term"
                            value={word.term}
                            onChange={(e) => handleUpdateFlashcard(word.id, 'term', e.target.value)}
                            fullWidth
                            margin="normal"
                            size="small"
                            placeholder="e.g., Hello"
                          />
                          <TextField
                            label="Translation"
                            value={word.translation}
                            onChange={(e) => handleUpdateFlashcard(word.id, 'translation', e.target.value)}
                            fullWidth
                            margin="normal"
                            size="small"
                            placeholder="e.g., Hola"
                          />
                          <TextField
                            label="Example Usage (Optional)"
                            value={word.example || ''}
                            onChange={(e) => handleUpdateFlashcard(word.id, 'example', e.target.value)}
                            fullWidth
                            margin="normal"
                            size="small"
                            placeholder="e.g., Hello, how are you today?"
                          />
                        </Card>
                      ))}
                      
                      <Button
                        variant="outlined"
                        startIcon={<AddIcon />}
                        onClick={handleAddFlashcard}
                        sx={{ mt: 1 }}
                      >
                        Add Flashcard
                      </Button>
                    </Box>
                  )}
                  
                  <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
                    <Button variant="outlined" onClick={toggleQuestionForm}>
                      Cancel
                    </Button>
                    <Button 
                      variant="contained" 
                      onClick={handleAddOrUpdateQuestion}
                    >
                      {editingQuestionId ? 'Update Question' : 'Add Question'}
                    </Button>
                  </Box>
                </CardContent>
              </Card>
            )}
          </Box>
        </TabPanel>

        <TabPanel value={activeTab} index={2}>
          <Box sx={{ mt: 2 }}>
            <Typography variant="h6" gutterBottom>
              Assessment Image
            </Typography>
            <Paper sx={{ p: 3, mb: 4 }}>
              <FileUpload 
                onSuccess={handleImageUploadSuccess}
                onError={handleUploadError}
                accept="image/*"
                maxSize={5}
                label="Upload Assessment Image"
              />
              {assessmentImage && (
                <Box sx={{ mt: 2 }}>
                  <Typography variant="subtitle2" gutterBottom>
                    Current Image:
                  </Typography>
                  <Box 
                    component="img" 
                    src={assessmentImage} 
                    alt="Assessment cover"
                    sx={{ 
                      maxWidth: '100%', 
                      maxHeight: '200px',
                      display: 'block',
                      mt: 1
                    }}
                  />
                </Box>
              )}
            </Paper>
            
            <Typography variant="h6" gutterBottom>
              Additional Materials
            </Typography>
            <Paper sx={{ p: 3 }}>
              <FileUpload 
                onSuccess={handleMaterialsUploadSuccess}
                onError={handleUploadError}
                accept=".pdf,.doc,.docx,.txt,.mp3,.mp4"
                maxSize={20}
                multiple
                label="Upload Additional Materials"
              />
              
              {assessmentMaterials.length > 0 && (
                <List sx={{ mt: 2 }}>
                  <Typography variant="subtitle2" gutterBottom>
                    Uploaded Materials:
                  </Typography>
                  {assessmentMaterials.map((material, index) => (
                    <ListItem key={index}>
                      <ListItemText 
                        primary={material.name}
                        secondary={`${(material.size / 1024 / 1024).toFixed(2)} MB`}
                      />
                      <ListItemSecondaryAction>
                        <IconButton 
                          edge="end" 
                          aria-label="delete"
                          onClick={() => handleRemoveMaterial(index)}
                        >
                          <DeleteIcon />
                        </IconButton>
                      </ListItemSecondaryAction>
                    </ListItem>
                  ))}
                </List>
              )}
            </Paper>
          </Box>
        </TabPanel>

        <Box sx={{ mt: 4, display: 'flex', justifyContent: 'space-between' }}>
          <Button 
            variant="outlined" 
            onClick={() => navigate(-1)}
          >
            Cancel
          </Button>
          
          <Box>
            {activeTab > 0 && (
              <Button 
                variant="outlined" 
                onClick={() => setActiveTab(activeTab - 1)}
                sx={{ mr: 2 }}
              >
                Previous
              </Button>
            )}
            
            {activeTab < 2 ? (
              <Button 
                variant="contained" 
                onClick={() => setActiveTab(activeTab + 1)}
              >
                Next
              </Button>
            ) : (
              <Button 
                variant="contained" 
                onClick={handleSubmit}
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Creating...' : 'Create Assessment'}
              </Button>
            )}
          </Box>
        </Box>
      </Paper>
    </Container>
  );
};

export default CreateAssessment; 