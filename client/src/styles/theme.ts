import { createTheme, ThemeOptions, PaletteOptions } from '@mui/material/styles';
import { TypographyOptions } from '@mui/material/styles/createTypography';
import { Components, Theme } from '@mui/material/styles';

// Define common typography settings
const typography: TypographyOptions = {
  fontFamily: '"Montserrat", "Arial", sans-serif',
  h1: {
    fontSize: '2.5rem',
    fontWeight: 600,
    lineHeight: 1.2,
    '@media (max-width:600px)': {
      fontSize: '2rem',
    },
  },
  h2: {
    fontSize: '2rem',
    fontWeight: 600,
    lineHeight: 1.3,
    '@media (max-width:600px)': {
      fontSize: '1.625rem',
    },
  },
  h3: {
    fontSize: '1.5rem',
    fontWeight: 500,
    lineHeight: 1.4,
    '@media (max-width:600px)': {
      fontSize: '1.125rem',
    },
  },
  h4: {
    fontSize: '1.125rem',
    fontWeight: 500,
    lineHeight: 1.4,
    '@media (max-width:600px)': {
      fontSize: '1rem',
    },
  },
  body1: {
    fontSize: '1rem',
    lineHeight: 1.5,
    '@media (max-width:600px)': {
      fontSize: '0.875rem',
    },
  },
  body2: {
    fontSize: '0.875rem',
    lineHeight: 1.6,
  },
  button: {
    fontWeight: 500,
    fontSize: '1rem',
    textTransform: 'none' as const,
  },
};

// Define common component overrides
const commonComponents: Components<Theme> = {
  MuiButton: {
    defaultProps: {
      disableElevation: true,
    },
    styleOverrides: {
      root: {
        borderRadius: 8,
        padding: '0.75rem 1.5rem',
        '&:hover': {
          transform: 'translateY(-1px)',
          transition: 'transform 0.2s ease-in-out',
        },
      },
      contained: {
        boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
      },
    },
  },
  MuiCard: {
    styleOverrides: {
      root: {
        borderRadius: 12,
      },
    },
  },
  MuiLink: {
    styleOverrides: {
      root: {
        textDecoration: 'none',
      },
    },
  },
};

// Light theme palette
const lightPalette: PaletteOptions = {
  mode: 'light',
  primary: {
    main: '#34548a', // Tokyo Night Light's blue
    light: '#4973b6',
    dark: '#2c4674',
    contrastText: '#d4d6e4',
  },
  secondary: {
    main: '#9854cb', // Tokyo Night Light's purple
    light: '#ab6ed4',
    dark: '#8347b9',
    contrastText: '#d4d6e4',
  },
  error: {
    main: '#f52a65', // Tokyo Night Light's red
    light: '#f7517f',
    dark: '#d91f54',
    contrastText: '#d4d6e4',
  },
  info: {
    main: '#166775', // Tokyo Night Light's cyan
    light: '#1b7c8c',
    dark: '#125761',
    contrastText: '#d4d6e4',
  },
  success: {
    main: '#587539', // Tokyo Night Light's green
    light: '#698c44',
    dark: '#485f2e',
    contrastText: '#d4d6e4',
  },
  warning: {
    main: '#8f5e15', // Tokyo Night Light's orange
    light: '#a87019',
    dark: '#784f11',
    contrastText: '#d4d6e4',
  },
  text: {
    primary: '#343b58', // Tokyo Night Light's main text
    secondary: '#6a6f87', // Tokyo Night Light's comments
    disabled: 'rgba(52, 59, 88, 0.38)',
  },
  background: {
    default: '#d5d6db', // Tokyo Night Light's background
    paper: '#e1e2e7', // Tokyo Night Light's lighter background
  },
  divider: 'rgba(52, 59, 88, 0.12)',
  action: {
    active: 'rgba(52, 59, 88, 0.54)',
    hover: 'rgba(52, 84, 138, 0.08)',
    selected: 'rgba(52, 84, 138, 0.16)',
    disabled: 'rgba(52, 59, 88, 0.26)',
    disabledBackground: 'rgba(52, 59, 88, 0.12)',
    focus: 'rgba(52, 84, 138, 0.12)',
  },
};

// Dark theme palette
const darkPalette: PaletteOptions = {
  mode: 'dark',
  primary: {
    main: '#7aa2f7', // Tokyo Night's bright blue
    light: '#89b4ff',
    dark: '#6b91e4',
    contrastText: '#1a1b26', // Tokyo Night background
  },
  secondary: {
    main: '#bb9af7', // Tokyo Night's purple
    light: '#c9aeff',
    dark: '#a987e0',
    contrastText: '#1a1b26',
  },
  error: {
    main: '#f7768e', // Tokyo Night's red
    light: '#ff8ca3',
    dark: '#e06079',
    contrastText: '#1a1b26',
  },
  info: {
    main: '#73daca', // Tokyo Night's cyan
    light: '#86e6d5',
    dark: '#65c1b3',
    contrastText: '#1a1b26',
  },
  success: {
    main: '#9ece6a', // Tokyo Night's green
    light: '#b0d67f',
    dark: '#8bb955',
    contrastText: '#1a1b26',
  },
  warning: {
    main: '#e0af68', // Tokyo Night's orange
    light: '#f0bc75',
    dark: '#cc9b5b',
    contrastText: '#1a1b26',
  },
  text: {
    primary: '#c0caf5', // Tokyo Night's foreground
    secondary: '#565f89', // Tokyo Night's comments
    disabled: 'rgba(169, 177, 214, 0.38)', // Based on Tokyo Night's muted text
  },
  background: {
    default: '#1a1b26', // Tokyo Night's background
    paper: '#24283b', // Tokyo Night's terminal background
  },
  divider: 'rgba(86, 95, 137, 0.12)', // Based on comment color
  action: {
    active: 'rgba(169, 177, 214, 0.54)',
    hover: 'rgba(122, 162, 247, 0.08)',
    selected: 'rgba(122, 162, 247, 0.16)',
    disabled: 'rgba(169, 177, 214, 0.26)',
    disabledBackground: 'rgba(169, 177, 214, 0.12)',
    focus: 'rgba(122, 162, 247, 0.12)',
  },
};

// Light theme configuration
const lightComponents: Components<Theme> = {
  ...commonComponents,
  MuiCard: {
    styleOverrides: {
      root: {
        borderRadius: 12,
        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.05)',
        backgroundColor: '#e1e2e7',
      },
    },
  },
  MuiLink: {
    styleOverrides: {
      root: {
        textDecoration: 'none',
        color: '#34548a',
        '&:hover': {
          color: '#9854cb',
        },
      },
    },
  },
  MuiAppBar: {
    styleOverrides: {
      root: {
        backgroundColor: '#d5d6db',
        color: '#343b58',
      },
    },
  },
  MuiButton: {
    styleOverrides: {
      root: {
        '&:hover': {
          transform: 'translateY(-1px)',
          transition: 'transform 0.2s ease-in-out',
        },
      },
      contained: {
        backgroundColor: '#34548a',
        color: '#d4d6e4',
        '&:hover': {
          backgroundColor: '#4973b6',
        },
      },
      outlined: {
        borderColor: '#34548a',
        color: '#34548a',
        '&:hover': {
          borderColor: '#4973b6',
          color: '#4973b6',
        },
      },
      text: {
        color: '#34548a',
        '&:hover': {
          color: '#4973b6',
        },
      },
    },
  },
  MuiPaper: {
    styleOverrides: {
      root: {
        backgroundColor: '#e1e2e7',
      },
    },
  },
};

// Dark theme configuration
const darkComponents: Components<Theme> = {
  ...commonComponents,
  MuiCard: {
    styleOverrides: {
      root: {
        borderRadius: 12,
        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.2)',
        backgroundColor: '#24283b',
      },
    },
  },
  MuiLink: {
    styleOverrides: {
      root: {
        textDecoration: 'none',
        color: '#7aa2f7',
        '&:hover': {
          color: '#bb9af7',
        },
      },
    },
  },
  MuiAppBar: {
    styleOverrides: {
      root: {
        backgroundColor: '#1a1b26',
      },
    },
  },
  MuiPaper: {
    styleOverrides: {
      root: {
        backgroundImage: 'none',
        backgroundColor: '#24283b',
      },
    },
  },
  MuiButton: {
    styleOverrides: {
      root: {
        '&:hover': {
          transform: 'translateY(-1px)',
          transition: 'transform 0.2s ease-in-out',
        },
      },
      contained: {
        backgroundColor: '#7aa2f7',
        color: '#1a1b26',
        '&:hover': {
          backgroundColor: '#89b4ff',
        },
      },
      outlined: {
        borderColor: '#7aa2f7',
        color: '#7aa2f7',
        '&:hover': {
          borderColor: '#89b4ff',
          color: '#89b4ff',
        },
      },
      text: {
        color: '#7aa2f7',
        '&:hover': {
          color: '#89b4ff',
        },
      },
    },
  },
};

export const lightTheme: ThemeOptions = {
  typography,
  palette: lightPalette,
  shape: {
    borderRadius: 8,
  },
  components: lightComponents,
};

export const darkTheme: ThemeOptions = {
  typography,
  palette: darkPalette,
  shape: {
    borderRadius: 8,
  },
  components: darkComponents,
};

// Create the default theme (light)
const theme = createTheme(lightTheme);

export default theme;
