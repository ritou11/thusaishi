# thusaishi
This is the host for wechat subscription account "科协THU", especially focus on competitions in Tsinghua University.
## Branches
**Current worktree** is the backend of **server**. It offers auto-reply service in wechat.
**See branch 'gen' (another worktree) for static website generation and deploy on netlify.**
## Usage

```zsh
# init
yarn install
# prepare for data cleaning & insert
cp *.xlsx [original location] ./utils/
cd utils/
# generate competition infomation from xlsx
python data_cleaning.py
# insert to mongodb and generate contest_list.json
python data_insert.py
# run the server
cd ..
yarn start
```

## Deploy

```zsh
docker-compose up --build -d
```

