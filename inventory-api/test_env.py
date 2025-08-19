import os
from dotenv import load_dotenv
env_vars = os.environ.keys()
print(list(env_vars))

print('--------------------------------------------------------')
print(os.environ.get('HOME'))
load_dotenv()
print('DATABASE_URL' in list(env_vars))
print('hehe' in list (env_vars))