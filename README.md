# QR Code Azure Function

Azure Functions v4 (Node.js) で QR コード PNG を生成するサンプルです。HTTP リクエストで `text` を受け取り、画像をそのまま返します。

## Endpoint

- Function name: `qrcodeCreate`
- Method: `GET`, `POST`
- Auth level: `anonymous`

ローカル実行時の URL:

```text
http://localhost:7071/api/qrcodeCreate
```

## Request examples

GET:

```bash
curl "http://localhost:7071/api/qrcodeCreate?text=https://example.com" --output qr.png
```

POST JSON:

```bash
curl -X POST "http://localhost:7071/api/qrcodeCreate" \
  -H "Content-Type: application/json" \
  -d '{"text":"https://example.com","size":400,"margin":1,"errorCorrectionLevel":"H"}' \
  --output qr.png
```

POST plain text:

```bash
curl -X POST "http://localhost:7071/api/qrcodeCreate" \
  -H "Content-Type: text/plain" \
  -d "https://example.com" \
  --output qr.png
```

## Parameters

- `text`: QR コード化する文字列。必須
- `size`: 画像サイズ。`128` から `2048` の範囲。既定値 `320`
- `margin`: 余白。`0` から `10` の範囲。既定値 `2`
- `errorCorrectionLevel`: `L`, `M`, `Q`, `H`。既定値 `M`

## Local setup

1. `local.settings.example.json` を参考に `local.settings.json` を用意
2. 依存関係をインストール
3. Azure Functions Core Tools で起動

```bash
npm install
func start
```

## Notes

- 返却形式は `image/png`
- `text` が空の場合は `400 Bad Request` を返します

## Azure deployment

Azure へのデプロイ設定として、Bicep と GitHub Actions を追加しています。

- IaC: `infra/main.bicep`
- Parameters example: `infra/main.parameters.example.json`
- CI/CD: `.github/workflows/deploy-functionapp.yml`

### 1. Azure リソースを作成

```bash
az group create --name rg-qrcode01-dev --location japaneast
az deployment group create \
  --resource-group rg-qrcode01-dev \
  --template-file infra/main.bicep \
  --parameters @infra/main.parameters.example.json
```

### 2. GitHub Secrets を設定

GitHub リポジトリに以下の Secrets を登録します。

- `AZURE_FUNCTIONAPP_NAME`: Function App 名
- `AZURE_FUNCTIONAPP_PUBLISH_PROFILE`: Function App の publish profile XML

publish profile の取得例:

```bash
az functionapp deployment list-publishing-profiles \
  --name qrcode01-func-dev \
  --resource-group rg-qrcode01-dev \
  --xml
```

### 3. デプロイ

`main` ブランチへ push するか、GitHub Actions の `workflow_dispatch` で手動実行します。

### 4. Azure で必要に応じて追加する設定

- CORS 制御
- `authLevel` を `function` へ変更して Function Key で保護
- Application Insights のアラート
