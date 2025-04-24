// Azure Storage service for uploading and retrieving files
import { BlobServiceClient, StorageSharedKeyCredential, generateBlobSASQueryParameters, BlobSASPermissions } from '@azure/storage-blob';
import { v4 as uuidv4 } from 'uuid';

// Get Azure Storage credentials from environment variables
const accountName = process.env.AZURE_STORAGE_ACCOUNT_NAME;
const accountKey = process.env.AZURE_STORAGE_ACCOUNT_KEY;
const containerName = process.env.AZURE_STORAGE_CONTAINER_NAME || 'notes';

// Create the BlobServiceClient with SharedKey credentials
const sharedKeyCredential = new StorageSharedKeyCredential(accountName, accountKey);
const blobServiceClient = new BlobServiceClient(
  `https://${accountName}.blob.core.windows.net`,
  sharedKeyCredential
);

// Get a reference to the container
const containerClient = blobServiceClient.getContainerClient(containerName);

/**
 * Upload a file to Azure Blob Storage
 * @param {Buffer} fileBuffer - The file buffer to upload
 * @param {string} fileName - The original file name
 * @param {string} contentType - The file's content type
 * @returns {Promise<object>} - Object containing the URL and other info of the uploaded file
 */
export async function uploadFile(fileBuffer, fileName, contentType) {
  try {
    // Create container if it doesn't exist
    await createContainerIfNotExists();
    
    // Generate a unique blob name to prevent overwrites
    const extension = fileName.split('.').pop();
    const blobName = `${uuidv4()}.${extension}`;
    
    // Get a block blob client
    const blockBlobClient = containerClient.getBlockBlobClient(blobName);
    
    // Set properties for the blob
    const options = {
      blobHTTPHeaders: {
        blobContentType: contentType,
        blobContentDisposition: `inline; filename="${fileName}"` 
      }
    };
    
    // Upload the data
    const uploadResponse = await blockBlobClient.upload(
      fileBuffer, 
      fileBuffer.length, 
      options
    );
    
    // Return useful information about the upload
    return {
      url: blockBlobClient.url,
      etag: uploadResponse.etag,
      fileName: fileName,
      blobName: blobName,
      contentType: contentType
    };
  } catch (error) {
    console.error('Error uploading file to Azure Blob Storage:', error);
    throw error;
  }
}

/**
 * Create the container if it doesn't already exist
 */
async function createContainerIfNotExists() {
  try {
    // Check if the container exists, but don't set public access
    // This works with storage accounts that have public access disabled
    const createContainerResponse = await containerClient.createIfNotExists({
      // No public access setting provided
    });
    
    if (createContainerResponse.succeeded) {
      console.log(`Container "${containerName}" created successfully`);
    }
  } catch (error) {
    console.error(`Error creating container "${containerName}":`, error);
    throw error;
  }
}

/**
 * Generate a Shared Access Signature (SAS) URL for a blob that expires after the specified time
 * @param {string} blobUrl - The URL of the blob
 * @param {number} expiryMinutes - The number of minutes until the SAS expires
 * @returns {string} - The URL with SAS token
 */
export async function generateSasUrl(blobUrl, expiryMinutes = 60) {
  try {
    // Extract the blob name from the URL
    const blobName = blobUrl.split('/').pop();
    
    // Get a reference to the blob
    const blobClient = containerClient.getBlobClient(blobName);
    
    // Create SAS token that's valid for expiryMinutes
    const startsOn = new Date();
    const expiresOn = new Date(startsOn);
    expiresOn.setMinutes(startsOn.getMinutes() + expiryMinutes);
    
    // Create the permissions for the SAS token
    const sasPermissions = new BlobSASPermissions();
    sasPermissions.read = true; // Only allow reading
    
    // Generate SAS token
    const sasQueryParameters = generateBlobSASQueryParameters({
      containerName,
      blobName,
      permissions: sasPermissions,
      startsOn,
      expiresOn,
      contentDisposition: 'inline' // Force the file to be viewed in the browser
    }, sharedKeyCredential);

    // Construct the complete URL with SAS token
    const sasUrl = `${blobClient.url}?${sasQueryParameters.toString()}`;
    
    return sasUrl;
  } catch (error) {
    console.error('Error generating SAS URL:', error);
    throw error;
  }
}

/**
 * Delete a file from Azure Blob Storage
 * @param {string} blobUrl - The URL of the blob to delete
 * @returns {Promise<boolean>} - True if the blob was deleted successfully
 */
export async function deleteFile(blobUrl) {
  try {
    // Extract the blob name from the URL
    const blobName = blobUrl.split('/').pop();
    
    // Get a reference to the blob
    const blockBlobClient = containerClient.getBlockBlobClient(blobName);
    
    // Delete the blob
    await blockBlobClient.delete();
    
    return true;
  } catch (error) {
    console.error('Error deleting file from Azure Blob Storage:', error);
    throw error;
  }
}