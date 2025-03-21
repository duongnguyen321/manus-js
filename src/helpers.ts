/**
 * Function to remove Vietnamese accents from a string
 * @function
 * @param {string} str - The string from which to remove accents
 * @returns {string} - The string after removing accents
 */
export function removeAccents(str: string): string {
	if (!str) return '';
	return str
		.normalize('NFD') // Normalize the string to Unicode Normalization Form D (NFD)
		.replace(/[\u0300-\u036f]/g, '') // Remove all combining diacritical marks
		.replace('đ', 'd') // Replace specific Vietnamese characters with their non-accented counterparts
		.replace('Đ', 'D'); // Replace specific Vietnamese characters with their non-accented counterparts
}


export default function slug(str: string, id?: string | number) {
	str = removeAccents(str);
	str = str
		.toLowerCase()
		.replace(/\s+/g, '-')
		.replace(/[^\w\-]+/g, '')
		.replace(/\-\-+/g, '-')
		.replace(/^-+/, '')
		.replace(/-+$/, '');
	if (id) {
		str += `~${id}`;
	}
	return str;
}


export const domainRegex = /^([a-zA-Z0-9-]+\.)+[a-zA-Z]{2,}(\/[a-zA-Z0-9-._~:/?#[$@!$&'()*+,;=]*)?$/;
export const domainOnlyRegex = /^([a-zA-Z0-9-]+\.)+[a-zA-Z]{2,}$/;
