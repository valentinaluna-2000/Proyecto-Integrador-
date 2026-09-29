import ts from 'typescript-eslint';
export default ts.config({ignores:['dist/**','node_modules/**','.angular/**']},...ts.configs.recommended,{rules:{'@typescript-eslint/no-explicit-any':'off','@typescript-eslint/no-unused-vars':['error',{argsIgnorePattern:'^_',varsIgnorePattern:'^_'}]}});
