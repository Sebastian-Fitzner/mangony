import React from 'react';
import TestBrick from './bricks/test-brick';

function Test({ text, src }) {
	return (
		<div className="c-test">
			<TestBrick />
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

export default Test;
