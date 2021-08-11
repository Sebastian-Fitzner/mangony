import React from 'react';

export default function Test({ text, src }) {
	return (
		<div className="c-test">
			<h3>test component headline</h3>
			<img
				width={'380px'}
				src={src} alt="picture"
			/>
			<div>
				{text}
			</div>
		</div>
	)
};
