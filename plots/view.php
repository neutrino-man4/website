<?php
session_start();
class DirectoryListing {
	/*


    TODO:
    Replace 'filter' with two options: selecting and removing
    Can use the pattern /^((?!pho).)*$/ to remove pho, e.g.

	====================================================================================================
	Evoluted Directory Listing Script - Version 4
	www.evoluted.net / info@evoluted.net
	====================================================================================================

	SYSTEM REQUIREMENTS
	====================================================================================================
	This script requires a PHP version 5.3 or above (5.6 is the recommended minimum) along with the GD
	library if you wish to use the thumbnail/image preview functionality. For (optional) unzip
	functionality, you'll need the ZipArchive php extension.

	HOW TO USE
	====================================================================================================
	1) Unzip the provided files.
	2) Upload the view.php file to the directory you wish to use the script on
	3) Browse to the directory to see the script in action
	4) Optionally change any of the settings below

	CONFIGURATION
	====================================================================================================
	You may edit any of the variables in this section to alter how the directory listing script will
	function. Please read the notes above each variable for details on what they change.
	*/

	// The top level directory where this script is located, or alternatively one of it's sub-directories
	public $startDirectory = '.';

	// An optional title to show in the address bar and at the top of your page (set to null to leave blank)
	public $pageTitle = "Plots Directory (Gallery view)";

	// The URL of this script. Optionally set if your server is unable to detect the paths of files
	public $includeUrl = 'https://etpwww.etp.kit.edu/~abal/plots/view.php';

	// If you've enabled the includeUrl parameter above, enter the full url to the directory the view.php file
	// is located in here, followed by a forward slash.
	public $directoryUrl = 'https://etpwww.etp.kit.edu/~abal/plots/';

	// Set to true to list all sub-directories and allow them to be browsed
	public $showSubDirectories = true;

	// Set to true to open all file links in a new browser tab
	public $openLinksInNewTab = true;

	// Set to true to show thumbnail previews of any images
	public $showThumbnails = false;

	// Set to true to allow new directories to be created.
	public $enableDirectoryCreation = false;

	// Set to true to allow file uploads (NOTE: you should set a password if you enable this!)
	public $enableUploads = false;

	// Enable multi-file uploads (NOTE: This makes use of javascript libraries hosted by Google so an internet connection is required.)
	public $enableMultiFileUploads = false;

	// Set to true to overwrite files on the server if they have the same name as a file being uploaded
	public $overwriteOnUpload = false;

	// Set to true to enable file deletion options
	public $enableFileDeletion = false;

	// Set to true to enable directory deletion options (only available when the directory is empty)
	public $enableDirectoryDeletion = false;

	// List of all mime types that can be uploaded. Full list of mime types: http://www.iana.org/assignments/media-types/media-types.xhtml
	public $allowedUploadMimeTypes = array(
		'image/jpeg',
		'image/gif',
		'image/png',
		'image/bmp',
		'audio/mpeg',
		'audio/mp3',
		'audio/mp4',
		'audio/x-aac',
		'audio/x-aiff',
		'audio/x-ms-wma',
		'audio/midi',
		'audio/ogg',
		'video/ogg',
		'video/webm',
		'video/quicktime',
		'video/x-msvideo',
		'video/x-flv',
		'video/h261',
		'video/h263',
		'video/h264',
		'video/jpeg',
		'text/plain',
		'text/html',
		'text/css',
		'text/csv',
		'text/calendar',
		'application/pdf',
		'application/x-pdf',
		'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // MS Word (modern)
		'application/msword',
		'application/vnd.ms-excel',
		'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // MS Excel (modern)
		'application/zip',
		'application/x-tar'
	);

	// Set to true to unzip any zip files that are uploaded (note - will overwrite files of the same name!)
	public $enableUnzipping = false;

	// If you've enabled unzipping, you can optionally delete the original zip file after its uploaded by setting this to true.
	public $deleteZipAfterUploading = false;

	// The Evoluted Directory Listing Script uses Bootstrap. By setting this value to true, a nicer theme will be loaded remotely.
	// Setting this to false will make the directory listing script use the default bootstrap style, loaded locally.
	public $enableTheme = true;

	// Set to true to require a password be entered before being able to use the script
	public $passwordProtect = false;

	// The password to require to use this script (only used if $passwordProtect is set to true)
	public $password = 'CMS';

	// Optional. Allow restricted access only to whitelisted IP addresses
	public $enableIpWhitelist = false;

	// List of IP's to allow access to the script (only used if $enableIpWhitelist is true)
	public $ipWhitelist = array(
		'127.0.0.1'
	);

	// File extensions to block from showing in the directory listing
	public $ignoredFileExtensions = array(
		'php',
		'ini',
	);

	// File names to block from showing in the directory listing
	public $ignoredFileNames = array(
		'.htaccess',
		'.DS_Store',
    'Thumbs.db',
    '.dropbox',
	);

	// Directories to block from showing in the directory listing
	public $ignoredDirectories = array(

	);

	// Files that begin with a dot are usually hidden files. Set this to false if you wish to show these hiden files.
	public $ignoreDotFiles = true;

	// Works the same way as $ignoreDotFiles but with directories.
	public $ignoreDotDirectories = true;

	/*
	====================================================================================================
	You shouldn't need to edit anything below this line unless you wish to add functionality to the
	script. You should only edit this area if you know what you are doing!
	====================================================================================================
	*/
	private $__previewMimeTypes = array(
		'image/gif',
		'image/jpeg',
		'image/png',
		'image/bmp'
	);

	private $__currentDirectory = null;

	private $__fileList = array();

	private $__directoryList = array();

	private $__debug = true;

	public $sortBy = 'name';

	public $sortableFields = array(
		'name',
		'size',
		'modified'
	);

	private $__sortOrder = 'asc';

	public function __construct() {
		define('DS', '/');
	}

	public function run() {
		if ($this->enableIpWhitelist) {
			$this->__ipWhitelistCheck();
		}

		$this->__currentDirectory = $this->startDirectory;

		// Sorting
		if (isset($_GET['order']) && in_array($_GET['order'], $this->sortableFields)) {
			$this->sortBy = $_GET['order'];
		}

		if (isset($_GET['sort']) && ($_GET['sort'] == 'asc' || $_GET['sort'] == 'desc')) {
			$this->__sortOrder = $_GET['sort'];
		}

		if (isset($_GET['dir']) || isset($_POST['download_dirpath'])) {
			if (isset($_GET['delete']) && $this->enableDirectoryDeletion) {
				$this->deleteDirectory();
			}

      if (isset($_POST['download_dirpath'])) {
        $this->__currentDirectory = $_POST['download_dirpath'];
      } else {
        $this->__currentDirectory = $_GET['dir'];
      }

			return $this->__display();
		} elseif (isset($_GET['preview'])) {
			$this->__generatePreview($_GET['preview']);
		} else {
			return $this->__display();
		}
	}

	public function login() {
		$password = filter_var($_POST['password'], FILTER_SANITIZE_STRING);

		if ($password === $this->password) {
			$_SESSION['evdir_loggedin'] = true;
			unset($_SESSION['evdir_loginfail']);
		} else {
			$_SESSION['evdir_loginfail'] = true;
			unset($_SESSION['evdir_loggedin']);

		}
	}

	public function upload() {
		$files = $this->__formatUploadArray($_FILES['upload']);

		if ($this->enableUploads) {
			if ($this->enableMultiFileUploads) {
				foreach ($files as $file) {
					$status = $this->__processUpload($file);
				}
			} else {
				$file = $files[0];
				$status = $this->__processUpload($file);
			}

			return $status;
		}
		return false;
	}

	private function __formatUploadArray($files) {
		$fileAry = array();
		$fileCount = count($files['name']);
		$fileKeys = array_keys($files);

		for ($i = 0; $i < $fileCount; $i++) {
			foreach ($fileKeys as $key) {
				$fileAry[$i][$key] = $files[$key][$i];
			}
		}

		return $fileAry;
	}

	private function __processUpload($file) {
		if (isset($_GET['dir'])) {
			$this->__currentDirectory = $_GET['dir'];
		}

		if (! $this->__currentDirectory) {
			$filePath = realpath($this->startDirectory);
		} else {
			$this->__currentDirectory = str_replace('..', '', $this->__currentDirectory);
			$this->__currentDirectory = ltrim($this->__currentDirectory, "/");
			$filePath = realpath($this->__currentDirectory);
		}

		$filePath = $filePath . DS . $file['name'];

		if (! empty($file)) {

			if (! $this->overwriteOnUpload) {
				if (file_exists($filePath)) {
					return 2;
				}
			}

			if (! in_array($file['type'], $this->allowedUploadMimeTypes)) {
				return 3;
			}

			move_uploaded_file($file['tmp_name'], $filePath);

			if ($file['type'] == 'application/zip' && $this->enableUnzipping && class_exists('ZipArchive')) {

				$zip = new ZipArchive;
				$result = $zip->open($filePath);
				$zip->extractTo(realpath($this->__currentDirectory));
				$zip->close();

				if ($this->deleteZipAfterUploading) {
					// Delete the zip file
					unlink($filePath);
				}


			}

			return true;
		}
	}

	public function deleteFile() {
		if (isset($_GET['deleteFile'])) {
			$file = $_GET['deleteFile'];

			// Clean file path
			$file = str_replace('..', '', $file);
			$file = ltrim($file, "/");

			// Work out full file path
			$filePath = __DIR__ . $this->__currentDirectory . '/' . $file;

			if (file_exists($filePath) && is_file($filePath)) {
				return unlink($filePath);
			}
			return false;
		}
	}

	public function deleteDirectory() {
		if (isset($_GET['dir'])) {
			$dir = $_GET['dir'];
			// Clean dir path
			$dir = str_replace('..', '', $dir);
			$dir = ltrim($dir, "/");

			// Work out full directory path
			$dirPath = __DIR__ . '/' . $dir;

			if (file_exists($dirPath) && is_dir($dirPath)) {

				$iterator = new RecursiveDirectoryIterator($dir, RecursiveDirectoryIterator::SKIP_DOTS);
				$files = new RecursiveIteratorIterator($iterator, RecursiveIteratorIterator::CHILD_FIRST);

				foreach ($files as $file) {
					if ($file->isDir()) {
						rmdir($file->getRealPath());
					} else {
						unlink($file->getRealPath());
					}
				}
				return rmdir($dir);
			}
		}
		return false;
	}

	public function createDirectory() {
		if ($this->enableDirectoryCreation) {
			$directoryName = $_POST['directory'];

			// Convert spaces
			$directoryName = str_replace(' ', '_', $directoryName);

			// Clean up formatting
			$directoryName = preg_replace('/[^\w-_]/', '', $directoryName);

			if (isset($_GET['dir'])) {
				$this->__currentDirectory = $_GET['dir'];
			}

			if (! $this->__currentDirectory) {
				$filePath = realpath($this->startDirectory);
			} else {
				$this->__currentDirectory = str_replace('..', '', $this->__currentDirectory);
				$filePath = realpath($this->__currentDirectory);
			}

			$filePath = $filePath . DS . strtolower($directoryName);

			if (file_exists($filePath)) {
				return false;
			}

			return mkdir($filePath, 0755);

		}
		return false;
	}

	public function sortUrl($sort) {

		// Get current URL parts
		$urlParts = parse_url($_SERVER['REQUEST_URI']);

		$url = '';

		if (isset($urlParts['scheme'])) {
			$url = $urlParts['scheme'] . '://';
		}

		if (isset($urlParts['host'])) {
			$url .= $urlParts['host'];
		}

		if (isset($urlParts['path'])) {
			$url .= $urlParts['path'];
		}


		// Extract query string
		if (isset($urlParts['query'])) {
			$queryString = $urlParts['query'];

			parse_str($queryString, $queryParts);

			// work out if we're already sorting by the current heading
			if (isset($queryParts['order']) && $queryParts['order'] == $sort) {
				// Yes we are, just switch the sort option!
				if (isset($queryParts['sort'])) {
					if ($queryParts['sort'] == 'asc') {
						$queryParts['sort'] = 'desc';
					} else {
						$queryParts['sort'] = 'asc';
					}
				}
			} else {
				$queryParts['order'] = $sort;
				$queryParts['sort'] = 'asc';
			}

			// Now convert back to a string
			$queryString = http_build_query($queryParts);

			$url .= '?' . $queryString;
		} else {
			$order = 'asc';
			if ($sort == $this->sortBy) {
				$order = 'desc';
			}
			$queryString = 'order=' . $sort . '&sort=' . $order;
			$url .= '?' . $queryString;
		}

		return $url;
	}

	public function sortClass($sort) {
		$class = $sort . '_';

		if ($this->sortBy == $sort) {
			if ($this->__sortOrder == 'desc') {
				$class .= 'desc sort_desc';
			} else {
				$class .= 'asc sort_asc';
			}
		} else {
			$class = '';
		}
		return $class;
	}

	private function __ipWhitelistCheck() {
		// Get the users ip
		$userIp = $_SERVER['REMOTE_ADDR'];

		if (! in_array($userIp, $this->ipWhitelist)) {
			header('HTTP/1.0 403 Forbidden');
			die('Your IP address (' . $userIp . ') is not authorized to access this file.');
		}
	}

	private function __display() {
		if ($this->__currentDirectory != '.' && !$this->__endsWith($this->__currentDirectory, DS)) {
			$this->__currentDirectory = $this->__currentDirectory . DS;
		}

		return $this->__loadDirectory($this->__currentDirectory);
	}

	private function __loadDirectory($path) {
		$files = $this->__scanDir($path);

		if (! empty($files)) {
			// Strip excludes files, directories and filetypes
			$files = $this->__cleanFileList($files);

			foreach ($files as $file) {
				$filePath = realpath($this->__currentDirectory . DS . $file);

				if ($this->__isDirectory($filePath)) {

					if (! $this->includeUrl) {
						$urlParts = parse_url($_SERVER['REQUEST_URI']);

						$dirUrl = '';

						if (isset($urlParts['scheme'])) {
							$dirUrl = $urlParts['scheme'] . '://';
						}

						if (isset($urlParts['host'])) {
							$dirUrl .= $urlParts['host'];
						}

						if (isset($urlParts['path'])) {
							$dirUrl .= $urlParts['path'];
						}
					} else {
						$dirUrl = $this->directoryUrl;
					}

					if ($this->__currentDirectory != '' && $this->__currentDirectory != '.') {
						$dirUrl .= '?dir=' . $this->__currentDirectory . $file;
					} else {
						$dirUrl .= '?dir=' . $file;
					}

					$this->__directoryList[$file] = array(
						'name' => $file,
						'path' => $filePath,
						'type' => 'dir',
						'url' => $dirUrl
					);
				} else {
					$this->__fileList[$file] = $this->__getFileType($filePath, $this->__currentDirectory . DS . $file);
				}
			}
		}

		if (! $this->showSubDirectories) {
			$this->__directoryList = null;
		}

		$data = array(
			'currentPath' => $this->__currentDirectory,
			'directoryTree' => $this->__getDirectoryTree(),
			'files' => $this->__setSorting($this->__fileList),
			'directories' => $this->__directoryList,
			'requirePassword' => $this->passwordProtect,
			'enableUploads' => $this->enableUploads
		);

		return $data;
	}

	private function __setSorting($data) {
		$sortOrder = '';
		$sortBy = '';

		// Sort the files
		if ($this->sortBy == 'name') {
			function compareByName($a, $b) {
				return strnatcasecmp($a['name'], $b['name']);
			}

			usort($data, 'compareByName');
			$this->sortBy = 'name';
		} elseif ($this->sortBy == 'size') {
			function compareBySize($a, $b) {
				return strnatcasecmp($a['size_bytes'], $b['size_bytes']);
			}

			usort($data, 'compareBySize');
			$this->soryBy = 'size';
		} elseif ($this->sortBy == 'modified') {
			function compareByModified($a, $b) {
				return strnatcasecmp($a['modified'], $b['modified']);
			}

			usort($data, 'compareByModified');
			$this->soryBy = 'modified';
		}

		if ($this->__sortOrder == 'desc') {
			$data = array_reverse($data);
		}
		return $data;
	}

	private function __scanDir($dir) {
		// Prevent browsing up the directory path.
		if (strstr($dir, '../')) {
			return false;
		}

		if ($dir == '/') {
			$dir = $this->startDirectory;
			$this->__currentDirectory = $dir;
		}

		$strippedDir = str_replace('/', '', $dir);

		$dir = ltrim($dir, "/");

		// Prevent listing blacklisted directories
		if (in_array($strippedDir, $this->ignoredDirectories)) {
			return false;
		}

		if (! file_exists($dir) || !is_dir($dir)) {
			return false;
		}

		return scandir($dir);
	}

	private function __cleanFileList($files) {
		$this->ignoredDirectories[] = '.';
		$this->ignoredDirectories[] = '..';

		foreach ($files as $key => $file) {

			// Remove unwanted directories
			if ($this->__isDirectory(realpath($file)) && in_array($file, $this->ignoredDirectories)) {
				unset($files[$key]);
			}

			// Remove dot directories (if enables)
			if ($this->ignoreDotDirectories && substr($file, 0, 1) === '.') {
				unset($files[$key]);
			}

			// Remove unwanted files
			if (! $this->__isDirectory(realpath($file)) && in_array($file, $this->ignoredFileNames)) {
				unset($files[$key]);
			}

			// Remove unwanted file extensions
			if (realpath($file) != '' && ! $this->__isDirectory(realpath($file))) {

				$info = pathinfo($file);
				$extension = $info['extension'];

				if (in_array($extension, $this->ignoredFileExtensions)) {
					unset($files[$key]);
				}

				// If dot files want ignoring, do that next
				if ($this->ignoreDotFiles) {

					if (substr($file, 0, 1) == '.') {
						unset($files[$key]);
					}
				}
			}
		}
		return $files;
	}

	private function __isDirectory($file) {
		if ($file == $this->__currentDirectory . DS . '.' || $file == $this->__currentDirectory . DS . '..') {
			return true;
		}
		if (filetype($file) == 'dir') {
			return true;
		}

		return false;
	}

	/**
	 * __getFileType
	 *
	 * Returns the formatted array of file data used for thre directory listing.
	 *
	 * @param  string $filePath Full path to the file
	 * @return array   Array of data for the file
	 */
	private function __getFileType($filePath, $relativePath = null) {
		$fi = new finfo(FILEINFO_MIME_TYPE);

		if (! file_exists($filePath)) {
			return false;
		}

		$type = $fi->file($filePath);

		$filePathInfo = pathinfo($filePath);

		$fileSize = filesize($filePath);

		$fileModified = filemtime($filePath);

		$filePreview = false;

		// Check if the file type supports previews
		if ($this->__supportsPreviews($type) && $this->showThumbnails) {
			$filePreview = true;
		}

		return array(
			'name' => $filePathInfo['basename'],
			'extension' => $filePathInfo['extension'],
			'dir' => $filePathInfo['dirname'],
			'path' => $filePath,
			'relativePath' => $relativePath,
			'size' => $this->__formatSize($fileSize),
			'size_bytes' => $fileSize,
			'modified' => $fileModified,
			'type' => 'file',
			'mime' => $type,
			'url' => $this->__getUrl($filePathInfo['basename']),
			'preview' => $filePreview,
			'target' => ($this->openLinksInNewTab ? '_blank' : '_parent')
		);
	}

	private function __supportsPreviews($type) {
		if (in_array($type, $this->__previewMimeTypes)) {
			return true;
		}
		return false;
	}

	/**
	 * __getUrl
	 *
	 * Returns the url to the file.
	 *
	 * @param  string $file filename
	 * @return string   url of the file
	 */
	private function __getUrl($file) {
		if (! $this->includeUrl) {
			$dirUrl = $_SERVER['REQUEST_URI'];

			$urlParts = parse_url($_SERVER['REQUEST_URI']);

			$dirUrl = '';

			if (isset($urlParts['scheme'])) {
				$dirUrl = $urlParts['scheme'] . '://';
			}

			if (isset($urlParts['host'])) {
				$dirUrl .= $urlParts['host'];
			}

			if (isset($urlParts['path'])) {
				$dirUrl .= $urlParts['path'];
			}
		} else {
			$dirUrl = $this->directoryUrl;
		}

		if ($this->__currentDirectory != '.') {
			$dirUrl = $dirUrl . $this->__currentDirectory;
		}
		return $dirUrl . $file;
	}

	private function __getDirectoryTree() {
		$dirString = $this->__currentDirectory;
		$directoryTree = array();

		$directoryTree['./'] = 'Index';

		if (substr_count($dirString, '/') >= 0) {
			$items = explode("/", $dirString);
			$items = array_filter($items);
			$path = '';
			foreach ($items as $item) {
				if ($item == '.' || $item == '..') {
					continue;
				}
				$path .= $item . '/';
				$directoryTree[$path] = $item;

			}
		}

		$directoryTree = array_filter($directoryTree);

		return $directoryTree;
	}

	private function __endsWith($haystack, $needle) {
		return $needle === "" || (($temp = strlen($haystack) - strlen($needle)) >= 0 && strpos($haystack, $needle, $temp) !== false);
	}

	private function __generatePreview($filePath) {
		$file = $this->__getFileType($filePath);

		if ($file['mime'] == 'image/jpeg') {
			$image = imagecreatefromjpeg($file['path']);
		} elseif ($file['mime'] == 'image/png') {
			$image = imagecreatefrompng($file['path']);
		} elseif ($file['mime'] == 'image/gif') {
			$image = imagecreatefromgif($file['path']);
		} else {
			die();
		}

		$oldX = imageSX($image);
		$oldY = imageSY($image);

		$newW = 250;
		$newH = 250;

		if ($oldX > $oldY) {
			$thumbW = $newW;
			$thumbH = $oldY * ($newH / $oldX);
		}
		if ($oldX < $oldY) {
			$thumbW = $oldX * ($newW / $oldY);
			$thumbH = $newH;
		}
		if ($oldX == $oldY) {
			$thumbW = $newW;
			$thumbH = $newW;
		}

		header('Content-Type: ' . $file['mime']);

		$newImg = ImageCreateTrueColor($thumbW, $thumbH);

		imagecopyresampled($newImg, $image, 0, 0, 0, 0, $thumbW, $thumbH, $oldX, $oldY);

		if ($file['mime'] == 'image/jpeg') {
			imagejpeg($newImg);
		} elseif ($file['mime'] == 'image/png') {
			imagepng($newImg);
		} elseif ($file['mime'] == 'image/gif') {
			imagegif($newImg);
		}
		imagedestroy($newImg);
		die();
	}

	private function __formatSize($bytes) {
		$units = array('B', 'KB', 'MB', 'GB', 'TB');

		$bytes = max($bytes, 0);
		$pow = floor(($bytes ? log($bytes) : 0) / log(1024));
		$pow = min($pow, count($units) - 1);

		$bytes /= pow(1024, $pow);

		return round($bytes, 2) . ' ' . $units[$pow];
	}

}

$listing = new DirectoryListing();

$successMsg = null;
$errorMsg = null;

if (isset($_POST['password'])) {
	$listing->login();

	if (isset($_SESSION['evdir_loginfail'])) {
		$errorMsg = 'Login Failed! Please check you entered the correct password an try again.';
		unset($_SESSION['evdir_loginfail']);
	}

} elseif (isset($_FILES['upload'])) {
	$uploadStatus = $listing->upload();
	if ($uploadStatus == 1) {
		$successMsg = 'Your file was successfully uploaded!';
	} elseif ($uploadStatus == 2) {
		$errorMsg = 'Your file could not be uploaded. A file with that name already exists.';
	} elseif ($uploadStatus == 3) {
		$errorMsg = 'Your file could not be uploaded as the file type is blocked.';
	}
} elseif (isset($_POST['directory'])) {
	if ($listing->createDirectory()) {
		$successMsg = 'Directory Created!';
	} else {
		$errorMsg = 'There was a problem creating your directory.';
	}
} elseif (isset($_GET['deleteFile']) && $listing->enableFileDeletion) {
	if ($listing->deleteFile()) {
		$successMsg = 'The file was successfully deleted!';
	} else {
		$errorMsg = 'The selected file could not be deleted. Please check your file permissions and try again.';
	}
} elseif (isset($_GET['dir']) && isset($_GET['delete']) && $listing->enableDirectoryDeletion) {
	if ($listing->deleteDirectory()) {
		$successMsg = 'The directory was successfully deleted!';
		unset($_GET['dir']);
	} else {
		$errorMsg = 'The selected directory could not be deleted. Please check your file permissions and try again.';
	}
}

$data = $listing->run();

function pr($data, $die = false) {
	echo '<pre>';
	print_r($data);
	echo '</pre>';

	if ($die) {
		die();
	}
}

$listUrl = htmlspecialchars(str_replace('view', 'index', "http://$_SERVER[HTTP_HOST]$_SERVER[REQUEST_URI]"));
?>
<html>
<head>
	<title><?php echo $data['currentPath'] . (!empty($listing->pageTitle) ? ' (' . $listing->pageTitle . ')' : null); ?> | Aritra Bal</title>
	<meta name="viewport" content="width=device-width; initial-scale=1.0; maximum-scale=1.0; minimum-scale=1.0; user-scalable=no; target-densityDpi=device-dpi" />
	<link rel="icon" type="image/png" href="../icons/icon.png">
	<link rel="preconnect" href="https://fonts.googleapis.com">
	<link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@700&display=swap" rel="stylesheet">
	<?php if($listing->enableTheme): ?>
	<link href="https://cdn.jsdelivr.net/npm/bootswatch@5.3.3/dist/flatly/bootstrap.min.css" rel="stylesheet">
	<?php else: ?>
	<link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css" rel="stylesheet">
	<?php endif; ?>
	<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.3/font/bootstrap-icons.min.css">
	<style>
		.plot-card {
			border: 1px solid #dee2e6;
			border-radius: 6px;
			overflow: hidden;
			margin-bottom: 20px;
			background: #fff;
			transition: box-shadow 0.2s ease, transform 0.2s ease;
		}
		.plot-card:hover {
			box-shadow: 0 4px 18px rgba(0,0,0,0.13);
			transform: translateY(-2px);
		}
		.plot-card img { width: 100%; display: block; }
		.plot-card-body { padding: 8px 10px; }
		.plot-name {
			display: block;
			font-size: 0.78rem;
			color: #6c757d;
			white-space: nowrap;
			overflow: hidden;
			text-overflow: ellipsis;
			margin-bottom: 5px;
		}
		.form-section {
			background: #f8f9fa;
			border: 1px solid #dee2e6;
			border-radius: 6px;
			padding: 10px 14px;
			margin-bottom: 10px;
		}
		.view-toggle-group {
			border-radius: 50px;
			overflow: hidden;
			box-shadow: 0 1px 5px rgba(0,0,0,0.12);
		}
		.view-toggle-group .btn {
			border-radius: 0;
			padding: 7px 22px;
			font-size: 0.875rem;
			font-weight: 500;
			letter-spacing: 0.01em;
		}
		.view-toggle-group .btn:first-child { border-radius: 50px 0 0 50px; }
		.view-toggle-group .btn:last-child  { border-radius: 0 50px 50px 0; }
		.page-title {
			font-family: 'Montserrat', sans-serif;
			text-transform: uppercase;
			letter-spacing: 0.22em;
			font-weight: 700;
			font-size: 1.55rem;
			animation: titleSlideIn 0.55s cubic-bezier(0.22, 0.61, 0.36, 1) both;
		}
		@keyframes titleSlideIn {
			from { opacity: 0; transform: translateX(-48px); }
			to   { opacity: 1; transform: translateX(0); }
		}

		/* Zoom overlay on card hover */
		.lightbox-link { position: relative; display: block; }
		.zoom-overlay {
			position: absolute;
			inset: 0;
			display: flex;
			align-items: center;
			justify-content: center;
			background: rgba(0,0,0,0);
			opacity: 0;
			transition: opacity 0.2s ease, background 0.2s ease;
			pointer-events: none;
		}
		.plot-card:hover .zoom-overlay {
			opacity: 1;
			background: rgba(0,0,0,0.22);
			pointer-events: auto;
		}
		.zoom-icon {
			width: 48px; height: 48px;
			display: flex; align-items: center; justify-content: center;
			background: rgba(255,255,255,0.92);
			border-radius: 50%;
			font-size: 1.35rem;
			color: #2c3e50;
			box-shadow: 0 2px 14px rgba(0,0,0,0.25);
			transform: scale(0.72);
			transition: transform 0.2s cubic-bezier(0.34,1.56,0.64,1);
			backdrop-filter: blur(4px);
			-webkit-backdrop-filter: blur(4px);
		}
		.plot-card:hover .zoom-icon { transform: scale(1); }

		/* Lightbox zoom viewport */
		.lightbox-viewport {
			overflow: hidden;
			background: #111;
			min-height: 340px;
			max-height: 75vh;
			position: relative;
			padding: 0 !important;
			cursor: default;
		}
		#lightbox-canvas {
			display: flex;
			align-items: center;
			justify-content: center;
			width: 100%;
			height: 100%;
			min-height: 340px;
			transform-origin: 0 0;
			will-change: transform;
		}
		#lightbox-img {
			max-width: 100%;
			max-height: 75vh;
			object-fit: contain;
			display: block;
			pointer-events: none;
			user-select: none;
			-webkit-user-drag: none;
		}
		.lightbox-viewport.can-pan { cursor: grab; }
		.lightbox-viewport.is-panning { cursor: grabbing !important; }
		.zoom-controls { display: flex; align-items: center; gap: 3px; }
		.zoom-controls .btn { width: 28px; height: 28px; padding: 0; display: flex; align-items: center; justify-content: center; font-size: 0.82rem; }
		#zoom-level { font-size: 0.74rem; min-width: 3.4em; text-align: center; color: #6c757d; font-variant-numeric: tabular-nums; }
	</style>
	<link href="styles.css" rel="stylesheet">
	<script>
		(function() {
			if (localStorage.getItem('theme') !== 'light')
				document.documentElement.setAttribute('data-theme', 'dark');
		})();
	</script>
</head>
<body>
	<?php if (! empty($listing->pageTitle)): ?>
	<header class="site-header" id="site-header">
		<h1 class="page-title mb-0"><?php echo $listing->pageTitle; ?></h1>
		<div class="d-flex align-items-center gap-2 flex-shrink-0">
			<div class="btn-group view-toggle-group" role="group" aria-label="View mode">
				<a href="<?php echo $listUrl; ?>" class="btn btn-outline-primary">
					<i class="bi bi-list-ul me-1"></i>List
				</a>
				<button type="button" class="btn btn-primary" disabled aria-current="page">
					<i class="bi bi-grid-3x3-gap-fill me-1"></i>Gallery
				</button>
			</div>
			<button id="theme-toggle" title="Toggle dark mode" aria-label="Toggle dark mode">
				<i id="theme-icon" class="bi bi-moon-fill"></i>
			</button>
		</div>
	</header>
	<?php endif; ?>

	<div class="container-fluid pt-3">

		<?php if (! empty($successMsg)): ?>
			<div class="alert alert-success"><?php echo $successMsg; ?></div>
		<?php endif; ?>

		<?php if (! empty($errorMsg)): ?>
			<div class="alert alert-danger"><?php echo $errorMsg; ?></div>
		<?php endif; ?>


		<?php if ($data['requirePassword'] && !isset($_SESSION['evdir_loggedin'])): ?>

			<div class="row">
				<div class="col-12">
				<hr>
					<form action="" method="post" class="d-flex justify-content-center align-items-center gap-2">
						<label class="mb-0">What experiment have I worked for?</label>
						<input type="password" name="password" class="form-control" style="width:auto;">
						<button type="submit" class="btn btn-primary">Login</button>
					</form>
				</div>
			</div>

		<?php else: ?>

			<?php if(! empty($data['directoryTree'])): ?>
				<div class="row">
					<div class="col-12">
						<nav aria-label="breadcrumb">
						<ol class="breadcrumb">
						<?php foreach ($data['directoryTree'] as $url => $name): ?>
							<?php $lastItem = end($data['directoryTree']); ?>
							<?php if($name === $lastItem): ?>
							<li class="breadcrumb-item active" aria-current="page"><?php echo htmlspecialchars($name); ?></li>
							<?php else: ?>
							<li class="breadcrumb-item">
								<a href="<?php $directoryUrl = 'https://etpwww.etp.kit.edu/~abal/plots/'; echo $directoryUrl."index.php?dir=$url"; ?>">
									<?php echo htmlspecialchars($name); ?>
								</a>
							</li>
							<?php endif; ?>
						<?php endforeach; ?>
						</ol>
						</nav>
					</div>
				</div>
			<?php endif; ?>

      <?php
                $regex = ".*";
                if (!empty($_GET["regex"])) {
                  $regex = $_GET["regex"];
                }

                //$download_regex = $regex . "((pdf$)|(png$)|(C$))";
                $download_regex = $regex;
                if (!empty($_POST["download_regex"])) {
                  $download_regex = $_POST["download_regex"];
                  $base_regex = $_POST["base_regex"];
                }
                if (isset($_POST["download_files"]) && $_POST["download_files"] == "Download files") {
                  $rootPath = realpath($_POST["download_dirpath"]);
                  $tarPath = sys_get_temp_dir(). DS . $_POST["download_name"] . '.tar';
                  $gzPath = $tarPath . '.gz';
                  unlink($tarPath); unlink($gzPath);
                  $phar = new PharData($tarPath);
                  foreach ($data['files'] as $file) {
                    if (preg_match("/" . $download_regex . "/",$file['name']))
                    {
                      $filePath = realpath($_POST["download_dirpath"] . DS . $file['name']);
                      $relativePath = $_POST["download_name"] . DS . substr($filePath,strlen($rootPath)+1);
                      $ret = $phar->addFile($filePath,$relativePath);
                      $ret = file_exists($filePath);
                    }
                  }

                  $phar->compress(Phar::GZ);

                  ob_end_clean();
                  header("Content-Type: application/x-gzip");
                  header("Content-Length: " . filesize($gzPath));
                  header(sprintf('Content-Disposition: attachment; filename="%s"',addslashes(basename($gzPath))));
                  flush();
                  readfile($gzPath);
                  exit(0);
                }
                if (isset($_POST["download_files"]) && $_POST["download_files"] == "Download recursively") {
                  $rootPath = realpath($_POST["download_dirpath"]);
                  $tarPath = sys_get_temp_dir(). DS . $_POST["download_name"] . '.tar';
                  $gzPath = $tarPath . '.gz';
                  unlink($tarPath); unlink($gzPath);
                  $phar = new PharData($tarPath);
                  $phar->buildFromDirectory($data['currentPath']);

                  $phar->compress(Phar::GZ);

                  ob_end_clean();
                  header("Content-Type: application/x-gzip");
                  header("Content-Length: " . filesize($gzPath));
                  header(sprintf('Content-Disposition: attachment; filename="%s"',addslashes(basename($gzPath))));
                  flush();
                  readfile($gzPath);
                  exit(0);

                }
      ?>

				<div class="row">
					<div class="col-12">
						<div class="form-section">
							<button class="panel-toggle" type="button" data-bs-toggle="collapse" data-bs-target="#filter-panel" aria-expanded="true" aria-controls="filter-panel">
								<span><i class="bi bi-funnel me-1"></i>Filter</span>
								<i class="bi bi-chevron-down toggle-chevron"></i>
							</button>
							<div class="collapse show" id="filter-panel">
								<div class="d-flex align-items-center gap-2 flex-wrap pt-2">
									<button type="button" id="filter-select-all" class="ext-select-all">Deselect All</button>
									<div id="ext-checklist" class="d-flex flex-wrap gap-2"></div>
								</div>
							</div>
						</div>
						<div class="form-section">
							<button class="panel-toggle" type="button" data-bs-toggle="collapse" data-bs-target="#download-panel" aria-expanded="false" aria-controls="download-panel">
								<span><i class="bi bi-download me-1"></i>Download</span>
								<i class="bi bi-chevron-down toggle-chevron"></i>
							</button>
							<div class="collapse" id="download-panel">
								<form method="post" class="d-flex align-items-center gap-2 flex-wrap pt-2" action="<?php echo htmlspecialchars($_SERVER["PHP_SELF"]);?>">
									<input type="hidden" name="base_regex" value="<?php echo htmlspecialchars($regex); ?>">
									<input type="hidden" name="download_dirpath" value="<?php echo htmlspecialchars($data['currentPath']); ?>">
									<input type="text" name="download_regex" class="form-control form-control-sm" style="width:auto;" value="<?php echo htmlspecialchars($download_regex); ?>">
									<button type="submit" name="download_files" value="Download files" class="btn btn-sm btn-outline-primary">Download files</button>
									<button type="submit" name="download_files" value="Download recursively" class="btn btn-sm btn-outline-primary">Download recursively</button>
									<span class="text-muted">as</span>
									<input type="text" name="download_name" class="form-control form-control-sm" style="width:auto;" value="<?php echo htmlspecialchars(end($data['directoryTree'])); ?>">.tar.gz
								</form>
							</div>
						</div>
					</div>
				</div>



			<?php if (! empty($data['files'])): ?>
				<div class="row">
					<?php foreach ($data['files'] as $file): ?>
						<?php if ($file['mime']=='image/png'): ?>
							<?php $plotName = str_replace('Minus','-',str_replace('Plus','+',str_replace('Times','X',str_replace('Over','/',str_replace('AND',' && ',str_replace('_',' ',str_replace('.png','',$file['name']))))))); ?>
								<div class="col-md-3 col-sm-6 col-12" data-ext="png">
									<div class="plot-card lightbox-trigger"
										data-img-url="<?php echo htmlspecialchars($file['url']); ?>"
										data-plot-name="<?php echo htmlspecialchars($plotName); ?>"
										data-pdf-url="<?php echo file_exists(str_replace('.png','.pdf',$file['path'])) ? htmlspecialchars(str_replace('png','pdf',$file['url'])) : ''; ?>">
										<a href="<?php echo htmlspecialchars($file['url']); ?>" class="lightbox-link" aria-label="<?php echo htmlspecialchars($plotName); ?>">
											<img src="<?php echo htmlspecialchars($file['url']); ?>" alt="<?php echo htmlspecialchars($plotName); ?>" loading="lazy">
											<div class="zoom-overlay" aria-hidden="true">
												<div class="zoom-icon"><i class="bi bi-zoom-in"></i></div>
											</div>
										</a>
										<div class="plot-card-body">
											<div class="d-flex align-items-start justify-content-between gap-1">
												<span class="plot-name" title="<?php echo htmlspecialchars($plotName); ?>"><?php echo htmlspecialchars($plotName); ?></span>
												<button class="copy-btn flex-shrink-0" data-url="<?php echo htmlspecialchars($file['url']); ?>" title="Copy image URL">
													<i class="bi bi-clipboard"></i>
												</button>
											</div>
											<?php if (file_exists(str_replace('.png', '.pdf', $file['path']))): ?>
											<div>
												<a href="<?php echo str_replace('png','pdf',$file['url']); ?>" target="<?php echo $file['target']; ?>" class="badge fmt-pdf text-decoration-none">.pdf</a>
											</div>
											<?php endif; ?>
										</div>
									</div>
								</div>
						<?php endif; ?>
					<?php endforeach; ?>
				</div>
			<?php else: ?>
				<div class="row">
					<div class="col-12">
						<p class="alert alert-info text-center">This directory does not contain any images.</p>
					</div>
				</div>
			<?php endif; ?>

		<?php endif; ?>
	</div>
	<!-- Lightbox Modal -->
	<div class="modal fade" id="lightbox-modal" tabindex="-1" aria-hidden="true">
		<div class="modal-dialog modal-dialog-centered modal-xl">
			<div class="modal-content">
				<div class="modal-header py-2">
					<h6 class="modal-title" id="lightbox-title" style="font-family:'IBM Plex Mono',monospace;font-size:0.82rem;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;max-width:80%;"></h6>
					<button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
				</div>
				<div class="modal-body lightbox-viewport" id="lightbox-viewport">
					<div id="lightbox-canvas">
						<img id="lightbox-img" src="" alt="">
					</div>
				</div>
				<div class="modal-footer py-2 d-flex justify-content-between align-items-center">
					<div id="lightbox-badges" class="d-flex gap-2 align-items-center"></div>
					<div class="zoom-controls">
						<button id="zoom-out" class="btn btn-sm btn-outline-secondary" title="Zoom out (-)"><i class="bi bi-dash-lg"></i></button>
						<span id="zoom-level">100%</span>
						<button id="zoom-reset" class="btn btn-sm btn-outline-secondary" title="Reset zoom (double-click / 0)"><i class="bi bi-fullscreen-exit"></i></button>
						<button id="zoom-in" class="btn btn-sm btn-outline-secondary" title="Zoom in (+)"><i class="bi bi-plus-lg"></i></button>
					</div>
					<div class="d-flex gap-2">
						<button id="lightbox-prev" class="btn btn-sm btn-outline-secondary" title="Previous (←)">
							<i class="bi bi-chevron-left"></i>
						</button>
						<button id="lightbox-next" class="btn btn-sm btn-outline-secondary" title="Next (→)">
							<i class="bi bi-chevron-right"></i>
						</button>
						<button id="lightbox-copy" class="btn btn-sm btn-outline-primary" title="Copy image URL">
							<i class="bi bi-clipboard me-1"></i>Copy link
						</button>
						<a id="lightbox-open" href="#" target="_blank" class="btn btn-sm btn-outline-primary">
							<i class="bi bi-box-arrow-up-right me-1"></i>Open
						</a>
					</div>
				</div>
			</div>
		</div>
	</div>

	<!-- Compare Tool (desktop only) -->
	<button id="compare-fab" class="compare-fab" title="Compare images" aria-label="Open image comparison">
		<i class="bi bi-columns-gap"></i>
		<span id="compare-fab-badge" class="compare-fab-badge">0</span>
	</button>
	<div id="compare-backdrop" class="compare-drawer-backdrop"></div>
	<aside id="compare-drawer" class="compare-drawer" aria-label="Image comparison panel">
		<div class="compare-drawer-header">
			<h6><i class="bi bi-columns-gap me-1"></i>Compare</h6>
			<button id="compare-drawer-close" class="btn-close" aria-label="Close"></button>
		</div>
		<div class="compare-drawer-body">
			<p class="compare-folder-label"><i class="bi bi-folder2-open me-1"></i>This folder</p>
			<div id="compare-image-list" class="compare-image-list"></div>
			<p id="compare-empty-msg" class="compare-empty-msg" style="display:none;">No images in this folder.</p>
		</div>
		<div class="compare-drawer-footer">
			<div id="compare-tray" class="compare-tray"></div>
			<div class="compare-footer-meta">
				<span id="compare-sel-count">0 of 4 selected</span>
				<button id="compare-clear-btn" class="compare-clear-btn" disabled>Clear all</button>
			</div>
			<button id="compare-go-btn" class="compare-go-btn" disabled>
				<i class="bi bi-layout-split"></i>
				<span id="compare-go-label">Select 2–4 images</span>
			</button>
		</div>
	</aside>
	<!-- Comparison Canvas Modal -->
	<div class="modal fade" id="compare-modal" tabindex="-1" aria-hidden="true">
		<div class="modal-dialog modal-dialog-centered" style="max-width:96vw;width:96vw;margin:2vh auto;">
			<div class="modal-content" style="height:94vh;display:flex;flex-direction:column;background:#111;border-color:#222;">
				<div class="modal-header py-2" style="background:#111;border-bottom-color:#222;">
					<span style="font-size:0.78rem;font-weight:700;text-transform:uppercase;letter-spacing:0.1em;color:#009682;">
						<i class="bi bi-columns-gap me-1"></i>Comparison
					</span>
					<button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close" style="filter:invert(1) brightness(0.7);"></button>
				</div>
				<div class="modal-body p-0" style="flex:1;overflow:hidden;background:#111;">
					<div id="compare-canvas" class="compare-canvas"></div>
				</div>
			</div>
		</div>
	</div>
	<script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/js/bootstrap.bundle.min.js"></script>
	<?php if ($listing->enableMultiFileUploads): ?>
		<script src="https://ajax.googleapis.com/ajax/libs/jquery/1.11.3/jquery.min.js"></script>
		<script>
			$('button[name=add_file]').on('click', function(e) {
				e.preventDefault();
				$('.upload-field:last').clone().insertAfter('.upload-field:last').find('input').val('');
			});
		</script>
	<?php endif; ?>
	<script>
		(function() {
			// Theme toggle
			var btn  = document.getElementById('theme-toggle');
			var icon = document.getElementById('theme-icon');
			var dark = document.documentElement.getAttribute('data-theme') === 'dark';

			function applyTheme(toDark) {
				if (toDark) {
					document.documentElement.setAttribute('data-theme', 'dark');
					icon.className = 'bi bi-sun-fill';
					localStorage.setItem('theme', 'dark');
				} else {
					document.documentElement.removeAttribute('data-theme');
					icon.className = 'bi bi-moon-fill';
					localStorage.setItem('theme', 'light');
				}
			}

			if (dark) icon.className = 'bi bi-sun-fill';

			btn.addEventListener('click', function() {
				applyTheme(document.documentElement.getAttribute('data-theme') !== 'dark');
			});

			// Sticky header shadow on scroll
			var header = document.getElementById('site-header');
			if (header) {
				window.addEventListener('scroll', function() {
					header.classList.toggle('scrolled', window.scrollY > 4);
				}, { passive: true });
			}

			// Copy button
			document.querySelectorAll('.copy-btn').forEach(function(copyBtn) {
				copyBtn.addEventListener('click', function(e) {
					e.stopPropagation();
					var url  = this.dataset.url;
					var ic   = this.querySelector('i');
					var self = this;
					navigator.clipboard.writeText(url).then(function() {
						ic.className = 'bi bi-check-lg';
						self.classList.add('copied');
						setTimeout(function() {
							ic.className = 'bi bi-clipboard';
							self.classList.remove('copied');
						}, 2000);
					});
				});
			});

			// Lightbox
			var items   = [];
			var curIdx  = 0;
			var bsModal = null;

			document.querySelectorAll('.lightbox-trigger').forEach(function(card, i) {
				items.push({
					url:    card.dataset.imgUrl,
					name:   card.dataset.plotName,
					pdfUrl: card.dataset.pdfUrl || ''
				});
				card.querySelector('.lightbox-link').addEventListener('click', function(e) {
					e.preventDefault();
					showLightbox(i);
				});
			});

			function showLightbox(idx) {
				curIdx = idx;
				resetZoom();
				var item = items[idx];
				document.getElementById('lightbox-img').src = item.url;
				document.getElementById('lightbox-img').alt = item.name;
				document.getElementById('lightbox-title').textContent = item.name;
				document.getElementById('lightbox-open').href = item.url;

				var badges = document.getElementById('lightbox-badges');
				badges.innerHTML = '<a href="' + item.url + '" target="_blank" class="badge fmt-png text-decoration-none">.png</a>';
				if (item.pdfUrl) {
					badges.innerHTML += ' <a href="' + item.pdfUrl + '" target="_blank" class="badge fmt-pdf text-decoration-none">.pdf</a>';
				}

				document.getElementById('lightbox-prev').disabled = (idx === 0);
				document.getElementById('lightbox-next').disabled = (idx === items.length - 1);

				if (!bsModal) bsModal = new bootstrap.Modal(document.getElementById('lightbox-modal'));
				bsModal.show();
			}

			document.getElementById('lightbox-prev').addEventListener('click', function() {
				if (curIdx > 0) showLightbox(curIdx - 1);
			});

			document.getElementById('lightbox-next').addEventListener('click', function() {
				if (curIdx < items.length - 1) showLightbox(curIdx + 1);
			});

			// Keyboard navigation for lightbox
			document.addEventListener('keydown', function(e) {
				if (!document.getElementById('lightbox-modal').classList.contains('show')) return;
				if (e.key === 'ArrowLeft'  && curIdx > 0)               showLightbox(curIdx - 1);
				if (e.key === 'ArrowRight' && curIdx < items.length - 1) showLightbox(curIdx + 1);
				if (e.key === '+' || e.key === '=') zoomToward(lbViewport.offsetWidth / 2, lbViewport.offsetHeight / 2, 1.5);
				if (e.key === '-') zoomToward(lbViewport.offsetWidth / 2, lbViewport.offsetHeight / 2, 1 / 1.5);
				if (e.key === '0') resetZoom();
			});

			// Zoom / pan for lightbox
			var lbViewport = document.getElementById('lightbox-viewport');
			var lbCanvas   = document.getElementById('lightbox-canvas');
			var zoomLvlEl  = document.getElementById('zoom-level');
			var zScale = 1, zX = 0, zY = 0;
			var isPanning = false, panStartX = 0, panStartY = 0;
			var MIN_SCALE = 0.25, MAX_SCALE = 20;

			function applyZoom() {
				lbCanvas.style.transform = 'translate(' + zX + 'px,' + zY + 'px) scale(' + zScale + ')';
				zoomLvlEl.textContent = Math.round(zScale * 100) + '%';
				lbViewport.classList.toggle('can-pan', zScale > 1);
			}

			function resetZoom() {
				zScale = 1; zX = 0; zY = 0;
				applyZoom();
			}

			function zoomToward(cx, cy, factor) {
				var newScale = Math.min(MAX_SCALE, Math.max(MIN_SCALE, zScale * factor));
				if (newScale === zScale) return;
				var ratio = newScale / zScale;
				zX = cx - (cx - zX) * ratio;
				zY = cy - (cy - zY) * ratio;
				zScale = newScale;
				applyZoom();
			}

			// Scroll wheel zoom
			lbViewport.addEventListener('wheel', function(e) {
				e.preventDefault();
				var rect = lbViewport.getBoundingClientRect();
				var factor = e.deltaY < 0 ? 1.12 : 1 / 1.12;
				zoomToward(e.clientX - rect.left, e.clientY - rect.top, factor);
			}, { passive: false });

			// Mouse pan
			lbViewport.addEventListener('mousedown', function(e) {
				if (zScale <= 1 || e.button !== 0) return;
				isPanning = true;
				panStartX = e.clientX - zX;
				panStartY = e.clientY - zY;
				lbViewport.classList.add('is-panning');
				e.preventDefault();
			});
			document.addEventListener('mousemove', function(e) {
				if (!isPanning) return;
				zX = e.clientX - panStartX;
				zY = e.clientY - panStartY;
				applyZoom();
			});
			document.addEventListener('mouseup', function() {
				if (!isPanning) return;
				isPanning = false;
				lbViewport.classList.remove('is-panning');
			});

			// Touch pinch-to-zoom and pan
			var lastTouchDist = null, touchPanning = false;
			lbViewport.addEventListener('touchstart', function(e) {
				if (e.touches.length === 2) {
					lastTouchDist = Math.hypot(e.touches[1].clientX - e.touches[0].clientX, e.touches[1].clientY - e.touches[0].clientY);
					touchPanning = false;
					e.preventDefault();
				} else if (e.touches.length === 1 && zScale > 1) {
					touchPanning = true;
					panStartX = e.touches[0].clientX - zX;
					panStartY = e.touches[0].clientY - zY;
					e.preventDefault();
				}
			}, { passive: false });
			lbViewport.addEventListener('touchmove', function(e) {
				if (e.touches.length === 2 && lastTouchDist !== null) {
					var dist = Math.hypot(e.touches[1].clientX - e.touches[0].clientX, e.touches[1].clientY - e.touches[0].clientY);
					var rect = lbViewport.getBoundingClientRect();
					var midX = (e.touches[0].clientX + e.touches[1].clientX) / 2 - rect.left;
					var midY = (e.touches[0].clientY + e.touches[1].clientY) / 2 - rect.top;
					zoomToward(midX, midY, dist / lastTouchDist);
					lastTouchDist = dist;
					e.preventDefault();
				} else if (e.touches.length === 1 && touchPanning) {
					zX = e.touches[0].clientX - panStartX;
					zY = e.touches[0].clientY - panStartY;
					applyZoom();
					e.preventDefault();
				}
			}, { passive: false });
			lbViewport.addEventListener('touchend', function() { lastTouchDist = null; touchPanning = false; });

			// Double-click: zoom 3× at cursor, or reset if already zoomed
			lbViewport.addEventListener('dblclick', function(e) {
				var rect = lbViewport.getBoundingClientRect();
				if (zScale === 1) {
					zoomToward(e.clientX - rect.left, e.clientY - rect.top, 3);
				} else {
					resetZoom();
				}
			});

			// Zoom buttons
			document.getElementById('zoom-in').addEventListener('click', function() {
				zoomToward(lbViewport.offsetWidth / 2, lbViewport.offsetHeight / 2, 1.5);
			});
			document.getElementById('zoom-out').addEventListener('click', function() {
				zoomToward(lbViewport.offsetWidth / 2, lbViewport.offsetHeight / 2, 1 / 1.5);
			});
			document.getElementById('zoom-reset').addEventListener('click', resetZoom);

			// Reset zoom when modal closes or image changes
			document.getElementById('lightbox-modal').addEventListener('hide.bs.modal', resetZoom);

			// Copy image URL to clipboard
			document.getElementById('lightbox-copy').addEventListener('click', function() {
				var url = items[curIdx].url;
				var btn = this;
				var ic  = btn.querySelector('i');
				navigator.clipboard.writeText(url).then(function() {
					ic.className = 'bi bi-check-lg me-1';
					btn.textContent = '';
					btn.appendChild(ic);
					btn.appendChild(document.createTextNode('Copied!'));
					setTimeout(function() {
						ic.className = 'bi bi-clipboard me-1';
						btn.textContent = '';
						btn.appendChild(ic);
						btn.appendChild(document.createTextNode('Copy link'));
					}, 2000);
				});
			});
		})();
	</script>
	<script>
		(function() {
			var items = Array.from(document.querySelectorAll('[data-ext]'));
			if (!items.length) return;

			var extCount = {};
			items.forEach(function(el) {
				extCount[el.dataset.ext] = (extCount[el.dataset.ext] || 0) + 1;
			});

			var exts = Object.keys(extCount).sort();
			var active = new Set(exts);
			var checklist = document.getElementById('ext-checklist');
			var selectBtn = document.getElementById('filter-select-all');
			if (!checklist || !selectBtn) return;

			exts.forEach(function(ext) {
				var chip = document.createElement('button');
				chip.type = 'button';
				chip.className = 'ext-chip';
				chip.dataset.ext = ext;
				chip.textContent = '.' + ext + ' (' + extCount[ext] + ')';
				chip.addEventListener('click', function() {
					if (active.has(ext)) { active.delete(ext); chip.classList.add('off'); }
					else                  { active.add(ext);    chip.classList.remove('off'); }
					applyFilter();
					syncBtn();
				});
				checklist.appendChild(chip);
			});

			function applyFilter() {
				items.forEach(function(el) {
					el.style.display = active.has(el.dataset.ext) ? '' : 'none';
				});
			}

			function syncBtn() {
				selectBtn.textContent = (active.size === exts.length) ? 'Deselect All' : 'Select All';
			}

			selectBtn.addEventListener('click', function() {
				var allOn = (active.size === exts.length);
				if (allOn) {
					active.clear();
					checklist.querySelectorAll('.ext-chip').forEach(function(c) { c.classList.add('off'); });
				} else {
					exts.forEach(function(e) { active.add(e); });
					checklist.querySelectorAll('.ext-chip').forEach(function(c) { c.classList.remove('off'); });
				}
				applyFilter();
				syncBtn();
			});
		})();
	</script>
	<script>
		(function() {
			var MAX = 4;
			var STORE = 'etp_compare';
			var allImages = [];
			var cmpModal = null;

			// Load persisted selections (survive page navigation)
			var selected = [];
			try {
				var raw = localStorage.getItem(STORE);
				if (raw) { var p = JSON.parse(raw); if (Array.isArray(p)) selected = p; }
			} catch(e) {}

			document.querySelectorAll('.lightbox-trigger').forEach(function(el) {
				var url = el.dataset.imgUrl, name = el.dataset.plotName;
				if (!url || !name) return;
				var img = el.querySelector('img');
				allImages.push({ url: url, name: name, thumb: img ? img.src : url });
			});

			var fab = document.getElementById('compare-fab');
			// Show FAB if current page has images OR if there are persisted selections
			if (!allImages.length && !selected.length) { if (fab) fab.style.display = 'none'; return; }

			var listEl = document.getElementById('compare-image-list');

			if (allImages.length) {
				allImages.forEach(function(img) {
					var div = document.createElement('div');
					div.className = 'compare-image-item';
					div.dataset.url = img.url;
					div.innerHTML =
						'<img class="compare-thumb" src="' + esc(img.thumb) + '" alt="" loading="lazy">' +
						'<span class="compare-item-name">' + esc(img.name) + '</span>' +
						'<span class="compare-item-check"><i class="bi bi-check2"></i></span>';
					div.addEventListener('click', function() { toggle(img); });
					listEl.appendChild(div);
				});
			} else {
				document.getElementById('compare-empty-msg').style.display = '';
			}

			function esc(s) {
				return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
			}

			function save() {
				try { localStorage.setItem(STORE, JSON.stringify(selected)); } catch(e) {}
			}

			function toggle(img) {
				var pos = selected.findIndex(function(s) { return s.url === img.url; });
				if (pos >= 0) selected.splice(pos, 1);
				else if (selected.length < MAX) selected.push({ url: img.url, name: img.name, thumb: img.thumb });
				save();
				refresh();
			}

			function clearAll() {
				selected = [];
				save();
				refresh();
			}

			function refresh() {
				// Mark current-page list items
				listEl.querySelectorAll('.compare-image-item').forEach(function(el) {
					var on = selected.some(function(s) { return s.url === el.dataset.url; });
					el.classList.toggle('selected', on);
					el.classList.toggle('disabled', !on && selected.length >= MAX);
				});

				// Tray (shows all selections across all folders)
				var tray = document.getElementById('compare-tray');
				tray.innerHTML = '';
				for (var k = 0; k < MAX; k++) {
					var slot = document.createElement('div');
					slot.className = 'compare-tray-slot' + (k < selected.length ? ' filled' : '');
					if (k < selected.length) {
						var s = selected[k];
						slot.innerHTML =
							'<img src="' + esc(s.thumb) + '" alt="">' +
							'<span class="tray-num">' + (k + 1) + '</span>' +
							'<button class="tray-remove" data-k="' + k + '" title="Remove"><i class="bi bi-x"></i></button>';
						slot.querySelector('.tray-remove').addEventListener('click', function(e) {
							e.stopPropagation();
							selected.splice(+this.dataset.k, 1);
							save();
							refresh();
						});
					} else {
						slot.textContent = (k + 1);
					}
					tray.appendChild(slot);
				}

				var n = selected.length;
				document.getElementById('compare-sel-count').textContent = n + ' of ' + MAX + ' selected';
				document.getElementById('compare-clear-btn').disabled = (n === 0);
				var goBtn = document.getElementById('compare-go-btn');
				goBtn.disabled = n < 2;
				document.getElementById('compare-go-label').textContent = n >= 2 ? 'Compare ' + n + ' images' : 'Select 2–4 images';
				var badge = document.getElementById('compare-fab-badge');
				badge.textContent = n;
				badge.classList.toggle('visible', n > 0);
			}

			var drawer = document.getElementById('compare-drawer');
			var backdrop = document.getElementById('compare-backdrop');
			function openDrawer() { drawer.classList.add('open'); backdrop.classList.add('open'); }
			function closeDrawer() { drawer.classList.remove('open'); backdrop.classList.remove('open'); }
			fab.addEventListener('click', openDrawer);
			document.getElementById('compare-drawer-close').addEventListener('click', closeDrawer);
			backdrop.addEventListener('click', closeDrawer);
			document.getElementById('compare-clear-btn').addEventListener('click', clearAll);

			document.getElementById('compare-go-btn').addEventListener('click', function() {
				if (selected.length < 2) return;
				var canvas = document.getElementById('compare-canvas');
				canvas.innerHTML = '';
				canvas.dataset.count = selected.length;
				selected.forEach(function(s) {
					var cell = document.createElement('div');
					cell.className = 'compare-canvas-cell';
					cell.innerHTML =
						'<img src="' + esc(s.url) + '" alt="' + esc(s.name) + '" loading="lazy">' +
						'<div class="compare-cell-name">' + esc(s.name) + '</div>';
					canvas.appendChild(cell);
				});
				closeDrawer();
				if (!cmpModal) cmpModal = new bootstrap.Modal(document.getElementById('compare-modal'));
				cmpModal.show();
			});

			refresh();
		})();
	</script>
</body>
</html>
