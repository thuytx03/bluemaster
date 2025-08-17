import createShadowRoot from '@/helpers/createShadowRoot';
import styles from '@/index.css?inline';
import App from './App';


const root = createShadowRoot(styles);

root.render(<App />);
