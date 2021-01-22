
test('parseYAML return object', () => {
	const fs = require('fs');
	const parseYAML = require('../index');

	const str_1 = 
`---
# Hello World!

chart:    
    - {x: 1993, y: 5}

    - {x: 1994, y: 5}

    - {x: 1995, y: 5}
    
    - {x: 1996, y: 5}

receipt:     Oz-Ware Purchase Invoice # isto é um comentário
customer:
    given:   Dorothy
    family:  Gale

items:
    - part_no:   A4786
      descrip:   Water Bucket (Filled)
      price:     1.47
      quantity:  4

    - part_no:   E1628
      descrip:   High Heeled "Ruby" Slippers
      size:       8
      price:     100.27
      quantity:  1

bill-to:  &id001
    street: |
            123 Tornado Alley
            Suite 16
    city:   East Centerville
    state:  KS

ship-to:  *id001
specialDelivery:  >
    Follow the Yellow Brick
    Road to the Emerald City.
    Pay no attention to the man 
    behind the curtain.
...
`
	const str_2 = 
`create_key: yes
needs_agent: no
knows_oop: True
likes_emacs: TRUE
uses_cvs: false`

	const str_3 = `martin: {name: Martin D'vloper, job: Developer, skill: Elite}`


	const obj_1 = {
	  chart: [
	    { x: 1993, y: 5 },
	    { x: 1994, y: 5 },
	    { x: 1995, y: 5 },
	    { x: 1996, y: 5 }
	  ],
	  receipt: 'Oz-Ware Purchase Invoice',
	  customer: { given: 'Dorothy', family: 'Gale' },
	  items: [
	    {
	      part_no: 'A4786',
	      descrip: 'Water Bucket (Filled)',
	      price: 1.47,
	      quantity: 4
	    },
	    {
	      part_no: 'E1628',
	      descrip: 'High Heeled "Ruby" Slippers',
	      size: 8,
	      price: 100.27,
	      quantity: 1
	    }
	  ],
	  'bill-to': {
	    street: '123 Tornado Alley\nSuite 16',
	    city: 'East Centerville',
	    state: 'KS'
	  },
	  'ship-to': {
	    street: '123 Tornado Alley\nSuite 16',
	    city: 'East Centerville',
	    state: 'KS'
	  },
	  specialDelivery: 'Follow the Yellow Brick Road to the Emerald City. Pay no attention to the man behind the curtain.'
	}

	const obj_2 = {
		create_key: 'yes',
		needs_agent: 'no',
		knows_oop: 'True',
		likes_emacs: 'TRUE',
		uses_cvs: false
	}

	const obj_3 = { 
		martin: { 
			name: "Martin D'vloper, job: Developer, skill: Elite" 
		}
	}
	expect(parseYAML(str_1)).toEqual(obj_1);
	expect(parseYAML(str_2)).toEqual(obj_2);
	expect(parseYAML(str_3)).toEqual(obj_3);

})