const superagent = require('superagent');
const fs = require('fs');
const ora = require('ora');
const clipboardy = require('clipboardy');

const apiUrl = 'https://mp3fy.com/api/inspect/';

async function queryYoutubeToMp3Api(youtubeUrl) {
	const res = await superagent.post(apiUrl)
		.field('link', youtubeUrl);
	const { body } = res;
	const status = body.status;
	const downloadUrl = body.data.preview;
	const title = body.data.title;

	return {
		status,
		downloadUrl,
		title
	};
}

async function downloadToFile(mp3ApiResult) {
	const {
		status,
		downloadUrl,
		title
	} = mp3ApiResult;
	const cleanedTitle = title
		.trim()
		.replace(',', ' and')
		.replace('/', '|');
	const stream = fs.createWriteStream(`./${cleanedTitle}.mp3`);
	const req = superagent.get(downloadUrl);
	return new Promise((resolve, reject) => {
		req.pipe(stream)
			.on('close', resolve)
			.on('finish', resolve)
			.on('error', reject);
	});
}

async function main() {
	let spinner = ora('Copying YouTube URL from the clipboard');
	const clipboardContent = await clipboardy.read();
	spinner.succeed(`Copied URL ${clipboardContent} from the clipboard`);
	spinner.start('Querying MP3 API');
	let mp3ApiResult;
	try {
		mp3ApiResult = await queryYoutubeToMp3Api(clipboardContent);
		spinner.succeed();
	} catch (e) {
		spinner.fail('Something went wrong querying the MP3 API');
		throw e;
	}
	spinner.start(`Downloading ${mp3ApiResult.title}`);
	try {
		await downloadToFile(mp3ApiResult);
		spinner.succeed();
	} catch (e) {
		spinner.fail('Something went wrong donwloading the file');
		throw e;
	}
}

main().then().catch(e => console.error(e));