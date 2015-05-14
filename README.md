# Anternate Worlds
This interface prototype is an implementation in Tangelo roughly following the design of the user interface sketch created during the ETC workshop on May 12th.  This application looks for Euler outputs that have been stored in a particular collection in a database (default='etc').  A reformatting of the Euler output is required to represent outputs in the following manner:


{
	"name" : "run3",
	"date" : "2015-05-15 08:00:00",
	"results" : [
		{
			"name" : "world 0",
			"relations" : [
				{
					"type" : "disjoint",
					"from" : "1954.Prectir",
					"to" : "1936.ELLcarlud"
				},
				{
					"type" : "disjoint",
					"from" : "1954.Psubcin",
					"to" : "1936.ELLcarlud"
				}
			]
		},
		{
			"name" : "world 1",
			"relations" : [
				{
					"type" : "disjoint",
					"from" : "1954.Prectir",
					"to" : "1936.ELLcarlud"
				},
				{
					"type" : "disjoint",
					"from" : "1954.Psubcin",
					"to" : "1936.ELLcarlud"
				}
			]
		}
	]
}
			
